import 'reflect-metadata';
import { DataSource, getMetadataArgsStorage } from 'typeorm';
import { User } from '../src/modules/user/entity/user.entity';
import { Requirement } from '../src/modules/requirement/entity/requirement.entity';
import { Bid } from '../src/modules/bid/entity/bid.entity';
import { Contract } from '../src/modules/contract/entity/contract.entity';
import { OperationLog } from '../src/utils/operation-log.entity';
import { UserRole } from '../src/common/enums/user-role.enum';
import { RequirementStatus } from '../src/common/enums/requirement-status.enum';
import { BidStatus } from '../src/common/enums/bid-status.enum';
import { ContractStatus } from '../src/common/enums/contract-status.enum';
import { BidService } from '../src/modules/bid/bid.service';
import { ContractService } from '../src/modules/contract/contract.service';

let failures = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL  ${name}`, extra ?? '');
  }
}

async function main() {
  // SQLite 不支持 mysql 的 enum 列，测试前降级为 varchar 存储
  for (const col of getMetadataArgsStorage().columns) {
    const options = col.options as { type?: string; enum?: unknown };
    if (options.type === 'enum') {
      options.type = 'simple-enum';
      delete options.enum;
    }
  }

  const ds = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [User, Requirement, Bid, Contract, OperationLog],
    synchronize: true
  } as never);

  await ds.initialize();

  const users = ds.getRepository(User);
  const buyer = await users.save(
    users.create({
      username: 'buyer',
      email: 'buyer@test.com',

      role: UserRole.Client,
      passwordHash: 'x'

    })
  );
  const stranger = await users.save(
    users.create({
      username: 'stranger',
      email: 's@test.com',

      role: UserRole.Client,
      passwordHash: 'x'

    })
  );
  const f1 = await users.save(
    users.create({
      username: 'f1',
      email: 'f1@test.com',

      role: UserRole.Freelancer,
      passwordHash: 'x'

    })
  );
  const f2 = await users.save(
    users.create({
      username: 'f2',
      email: 'f2@test.com',

      role: UserRole.Freelancer,
      passwordHash: 'x'

    })
  );

  const reqs = ds.getRepository(Requirement);
  const req = await reqs.save(
    reqs.create({
      title: '测试需求',
      description: 'desc',
      budgetMin: 1000,
      budgetMax: 5000,
      deadline: '2026-12-31',
      publisherId: buyer.id,
      status: RequirementStatus.Open
    })
  );

  const bids = ds.getRepository(Bid);
  const bid1 = await bids.save(
    bids.create({
      requirementId: req.id,
      bidderId: f1.id,
      amount: 3000,
      durationDays: 10,
      proposal: 'p1',
      status: BidStatus.Pending
    })
  );
  const bid2 = await bids.save(
    bids.create({
      requirementId: req.id,
      bidderId: f2.id,
      amount: 4000,
      durationDays: 20,
      proposal: 'p2',
      status: BidStatus.Pending
    })
  );

  const contracts = ds.getRepository(Contract);
  const bidService = new BidService(bids, reqs, contracts, ds);
  const contractService = new ContractService(contracts, reqs);

  console.log('--- accept authorization ---');
  await bidService
    .accept(bid1.id, stranger.id)
    .then(() => check('stranger cannot accept', false))
    .catch(e => check('stranger cannot accept', e.status === 403, e.message));
  await bidService
    .accept(bid1.id, f1.id)
    .then(() => check('bidder cannot accept own bid', false))
    .catch(e => check('bidder cannot accept own bid', e.status === 403, e.message));

  console.log('--- accept creates pending contract ---');
  const accepted = await bidService.accept(bid1.id, buyer.id);
  check('winning bid accepted', accepted.status === BidStatus.Accepted);

  const other = await bids.findOneBy({ id: bid2.id });
  check('other bids invalidated', other?.status === BidStatus.Rejected, other?.status);

  const updatedReq = await reqs.findOneBy({ id: req.id });
  check(
    'requirement pending_sign after accept',
    updatedReq?.status === RequirementStatus.PendingSign,
    updatedReq?.status
  );
  check('winner recorded', updatedReq?.winnerId === f1.id);

  const contract = await contracts.findOne({ where: { requirementId: req.id } });
  check('contract created', !!contract);
  check('contract pending sign', contract?.status === ContractStatus.PendingSign);
  check('amount equals winning bid', Number(contract?.totalAmount) === 3000, contract?.totalAmount);
  check('parties set', contract?.buyerId === buyer.id && contract.freelancerId === f1.id);
  check('stage due date = accept + duration days', !!contract?.stages?.[0]?.dueDate);
  const expectedDue = new Date();
  expectedDue.setDate(expectedDue.getDate() + 10);
  check(
    'due date 10 days later',
    contract?.stages[0].dueDate === expectedDue.toISOString().slice(0, 10),
    contract?.stages[0].dueDate
  );
  check('stage amount equals bid', Number(contract?.stages[0].amount) === 3000);
  check('both signed timestamps null initially', !contract?.buyerSignedAt && !contract?.freelancerSignedAt);

  console.log('--- idempotent accept does not duplicate contract ---');
  await bidService.accept(bid1.id, buyer.id);
  const count = await contracts.count({ where: { requirementId: req.id } });
  check('only one contract after repeated accept', count === 1, count);

  console.log('--- bidding closed after award ---');
  await bidService
    .submit(f2.id, {
      requirementId: req.id,
      amount: 1,
      durationDays: 1,
      proposal: 'late'
    })
    .then(() => check('cannot bid after award', false))
    .catch(e => check('cannot bid after award', e.status === 400, e.message));

  if (!contract) throw new Error('no contract');

  console.log('--- sign by non-party forbidden ---');
  await contractService
    .sign(contract.id, stranger.id)
    .then(() => check('stranger cannot sign', false))
    .catch(e => check('stranger cannot sign', e.status === 403, e.message));

  console.log('--- first sign keeps waiting ---');
  await new Promise(r => setTimeout(r, 5));
  const once = await contractService.sign(contract.id, buyer.id);
  check('still pending_sign after first sign', once.status === ContractStatus.PendingSign);
  check('buyer signed time recorded', !!once.buyerSignedAt);
  check('freelancer still unsigned', !once.freelancerSignedAt);
  const reqStillPending = await reqs.findOneBy({ id: req.id });
  check('requirement not in progress yet', reqStillPending?.status === RequirementStatus.PendingSign);

  console.log('--- repeated sign by same party keeps first timestamp ---');
  const firstTs = once.buyerSignedAt;
  await new Promise(r => setTimeout(r, 20));
  const repeated = await contractService.sign(contract.id, buyer.id);
  check(
    'repeated sign keeps first timestamp',
    new Date(repeated.buyerSignedAt!).getTime() === new Date(firstTs!).getTime()
  );
  check('still pending after repeat', repeated.status === ContractStatus.PendingSign);

  console.log('--- second sign activates contract and advances requirement ---');
  const active = await contractService.sign(contract.id, f1.id);
  check('contract active after both sign', active.status === ContractStatus.Active);
  check('freelancer signed time recorded', !!active.freelancerSignedAt);
  const reqInProgress = await reqs.findOneBy({ id: req.id });
  check('requirement in progress', reqInProgress?.status === RequirementStatus.InProgress);

  console.log('--- sign again after active rejected ---');
  await contractService
    .sign(contract.id, buyer.id)
    .then(() => check('cannot sign active contract', false))
    .catch(e => check('cannot sign active contract', e.status === 400, e.message));

  console.log('--- complete flow intact ---');
  const completed = await contractService.complete(contract.id, buyer.id);
  check('contract completed', completed.status === ContractStatus.Completed);
  check('stages completed', completed.stages.every(s => s.completed));
  const reqCompleted = await reqs.findOneBy({ id: req.id });
  check('requirement completed', reqCompleted?.status === RequirementStatus.Completed);

  console.log('--- terminate flow on fresh contract ---');
  const req2 = await reqs.save(
    reqs.create({
      title: 'req2',
      description: 'd',
      budgetMin: 1,
      budgetMax: 2,
      deadline: '2026-12-31',
      publisherId: buyer.id,
      status: RequirementStatus.Open
    })
  );
  const bid3 = await bids.save(
    bids.create({
      requirementId: req2.id,
      bidderId: f1.id,
      amount: 500,
      durationDays: 3,
      proposal: 'p',
      status: BidStatus.Pending
    })
  );
  await bidService.accept(bid3.id, buyer.id);
  const c2 = await contracts.findOneByOrFail({ requirementId: req2.id });
  await contractService.sign(c2.id, buyer.id);
  await contractService.sign(c2.id, f1.id);
  const terminated = await contractService.terminate(c2.id, buyer.id);
  check('terminated contract status', terminated.status === ContractStatus.Terminated);
  await contractService
    .terminate(c2.id, buyer.id)
    .then(() => check('cannot terminate twice', false))
    .catch(e => check('cannot terminate twice', e.status === 400, e.message));

  await contractService
    .complete(c2.id, buyer.id)
    .then(() => check('stranger party guard works', false))
    .catch(() => undefined);
  await contractService
    .complete(c2.id, stranger.id)
    .then(() => check('non-party cannot operate', false))
    .catch(e => check('non-party cannot operate', e.status === 403));

  await ds.destroy();
  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
