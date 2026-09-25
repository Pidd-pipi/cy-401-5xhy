import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getMetadataArgsStorage } from 'typeorm';
import { BidModule } from '../src/modules/bid/bid.module';
import { ContractModule } from '../src/modules/contract/contract.module';
import { RequirementModule } from '../src/modules/requirement/requirement.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UserModule } from '../src/modules/user/user.module';
import { Bid } from '../src/modules/bid/entity/bid.entity';
import { Contract } from '../src/modules/contract/entity/contract.entity';
import { Requirement } from '../src/modules/requirement/entity/requirement.entity';
import { User } from '../src/modules/user/entity/user.entity';
import { OperationLog } from '../src/utils/operation-log.entity';
import { ContractStatus } from '../src/common/enums/contract-status.enum';

let failures = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL  ${name}`, extra ?? '');
  }
}

async function json(res: Response): Promise<any> {
  return res.json();
}

async function main() {
  for (const col of getMetadataArgsStorage().columns) {
    const options = col.options as { type?: string; enum?: unknown };
    if (options.type === 'enum') {
      options.type = 'simple-enum';
      delete options.enum;
    }
  }

  const moduleRef = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [User, Requirement, Bid, Contract, OperationLog],
        synchronize: true
      } as never),
      AuthModule,
      UserModule,
      RequirementModule,
      BidModule,
      ContractModule
    ]
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  const port = 29199;
  const server = app.getHttpServer();
  await new Promise<void>(resolve => server.listen(port, resolve));

  const base = `http://127.0.0.1:${port}`;
  const post = (path: string, body: unknown, token?: string) =>
    fetch(base + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
  const patch = (path: string, token?: string) =>
    fetch(base + path, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  const get = (path: string, token?: string) =>
    fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  const buyerRes = await post('/auth/register', {
    username: 'buyer',
    email: 'buyer@test.com',
    password: 'Pass1234',
    role: 'client'
  });
  check('buyer register 2xx', buyerRes.status < 300, buyerRes.status);
  const buyer = (await json(buyerRes as unknown as Response)) as { token: string };

  const freeRes = await post('/auth/register', {
    username: 'free',
    email: 'free@test.com',
    password: 'Pass1234',
    role: 'freelancer'
  });
  const free = (await json(freeRes as unknown as Response)) as { token: string };

  const otherRes = await post('/auth/register', {
    username: 'other',
    email: 'other@test.com',
    password: 'Pass1234',
    role: 'freelancer'
  });
  const other = (await json(otherRes as unknown as Response)) as { token: string };

  const me = (await (await get('/auth/me', buyer.token)).json()) as { id: string };
  const meFree = (await (await get('/auth/me', free.token)).json()) as { id: string };

  const reqRes = await post(
    '/requirements',
    {
      title: 'E2E 需求',
      description: 'desc',
      budgetMin: 1000,
      budgetMax: 9000,
      deadline: '2026-12-31'
    },
    buyer.token
  );
  const requirement = (await reqRes.json()) as { id: string };

  const bidRes = await post(
    '/bids',
    { requirementId: requirement.id, amount: 5200, durationDays: 14, proposal: '我来做' },
    free.token
  );
  const bid = (await bidRes.json()) as { id: string };

  const bid2Res = await post(
    '/bids',
    { requirementId: requirement.id, amount: 8800, durationDays: 30, proposal: '另一个' },
    other.token
  );
  const bid2 = (await bid2Res.json()) as { id: string };

  console.log('--- HTTP accept permission ---');
  const forbidden = await patch(`/bids/${bid.id}/accept`, other.token);
  check('non-publisher gets 403', forbidden.status === 403, forbidden.status);

  const noAuth = await patch(`/bids/${bid.id}/accept`);
  check('anonymous gets 401', noAuth.status === 401, noAuth.status);

  console.log('--- HTTP accept flow ---');
  const acceptRes = await patch(`/bids/${bid.id}/accept`, buyer.token);
  check('publisher accepts 200', acceptRes.status === 200, acceptRes.status);

  const bid2After = (await (await get(`/bids/requirement/${requirement.id}`)).json()) as Array<{
    id: string;
    status: string;
  }>;
  const losing = bid2After.find(b => b.id === bid2.id);
  check('other bid rejected over HTTP', losing?.status === 'rejected', losing?.status);

  const contracts = (await (await get(`/contracts/requirement/${requirement.id}`)).json()) as Array<{
    id: string;
    contractNo: string;
    totalAmount: string;
    status: string;
    stages: Array<{ dueDate: string }>;
    buyerId: string;
    freelancerId: string;
  }>;
  check('one contract generated', contracts.length === 1, contracts.length);
  const contract = contracts[0];
  check('contract pending_sign', contract.status === ContractStatus.PendingSign);
  check('amount is winning bid', Number(contract.totalAmount) === 5200, contract.totalAmount);
  check('parties mapped', contract.buyerId === me.id && contract.freelancerId === meFree.id);
  const expected = new Date();
  expected.setDate(expected.getDate() + 14);
  check('stage due date follows duration', contract.stages[0].dueDate === expected.toISOString().slice(0, 10));

  const reqAfter = (await (await get(`/requirements/${requirement.id}`)).json()) as { status: string };
  check('requirement pending_sign before both sign', reqAfter.status === 'pending_sign', reqAfter.status);

  console.log('--- HTTP dual sign flow ---');
  const buyerSign = await patch(`/contracts/${contract.id}/sign`, buyer.token);
  const buyerSignBody = (await buyerSign.json()) as {
    status: string;
    buyerSignedAt: string | null;
    freelancerSignedAt: string | null;
  };
  check('first sign keeps pending_sign', buyerSignBody.status === 'pending_sign');
  check('first sign timestamp shown', !!buyerSignBody.buyerSignedAt);
  check('other party unsigned', !buyerSignBody.freelancerSignedAt);

  const strangerSign = await patch(`/contracts/${contract.id}/sign`, other.token);
  check('third party cannot sign', strangerSign.status === 403, strangerSign.status);

  const firstTime = buyerSignBody.buyerSignedAt;
  const repeat = await patch(`/contracts/${contract.id}/sign`, buyer.token);
  const repeatBody = (await repeat.json()) as typeof buyerSignBody;
  check('repeat sign keeps first time', repeatBody.buyerSignedAt === firstTime);
  check('repeat sign still waiting', repeatBody.status === 'pending_sign');

  const freeSign = await patch(`/contracts/${contract.id}/sign`, free.token);
  const freeSignBody = (await freeSign.json()) as { status: string };
  check('second sign activates', freeSignBody.status === ContractStatus.Active);

  const reqProgress = (await (await get(`/requirements/${requirement.id}`)).json()) as {
    status: string;
  };
  check('requirement advances to in_progress', reqProgress.status === 'in_progress', reqProgress.status);

  console.log('--- HTTP complete / terminate remain ---');
  const complete = await patch(`/contracts/${contract.id}/complete`, free.token);
  const completeBody = (await complete.json()) as { status: string };
  check('complete still works', completeBody.status === 'completed', completeBody.status);
  const reqDone = (await (await get(`/requirements/${requirement.id}`)).json()) as {
    status: string;
  };
  check('requirement completed', reqDone.status === 'completed');

  await app.close();
  console.log(failures === 0 ? '\nHTTP E2E ALL PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
