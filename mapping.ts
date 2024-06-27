import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Swap } from "../generated/Quickswap/Quickswap";
import { Strategy, APR } from "../generated/schema";

export function handleSwap(event: Swap): void {
  let strategy = Strategy.load(event.params.strategyAddress.toHexString());
  if (strategy == null) {
    strategy = new Strategy(event.params.strategyAddress.toHexString());
    strategy.createdAtTimestamp = event.block.timestamp;
    strategy.collectedFeesToken0 = BigInt.fromI32(0);
    strategy.collectedFeesToken1 = BigInt.fromI32(0);
    strategy.amount0 = BigInt.fromI32(0);
    strategy.amount1 = BigInt.fromI32(0);
  }

  strategy.collectedFeesToken0 = strategy.collectedFeesToken0.plus(event.params.amount0);
  strategy.collectedFeesToken1 = strategy.collectedFeesToken1.plus(event.params.amount1);
  strategy.amount0 = event.params.reserve0;
  strategy.amount1 = event.params.reserve1;
  strategy.save();

  let apr = APR.load(event.params.strategyAddress.toHexString());
  if (apr == null) {
    apr = new APR(event.params.strategyAddress.toHexString());
    apr.strategy = strategy.id;
  }

  let totalFees = strategy.collectedFeesToken0.plus(strategy.collectedFeesToken1);
  let totalAmount = strategy.amount0.plus(strategy.amount1);
  let days = event.block.timestamp.minus(strategy.createdAtTimestamp).toBigDecimal().div(BigDecimal.fromString("86400"));
  apr.apr = totalFees.toBigDecimal().div(totalAmount.toBigDecimal()).times(BigDecimal.fromString("365")).div(days).times(BigDecimal.fromString("100"));
  apr.save();
}
