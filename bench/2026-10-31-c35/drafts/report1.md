# Embedded key-value store benchmark: KVLite, StoneDB and Marlin

## Purpose and method

This note reports a benchmark of three embedded key-value stores, KVLite 4.2.1, StoneDB 2.8.0 and Marlin 0.9.2, carried out to inform the choice of storage engine for a write-heavy ingestion service. We measured bulk insert, uniform random point reads and a 50/50 mixed workload on a dataset of 10 million keys, and we also ran a larger bulk-insert test at 100 million keys. Keys were 16 bytes and values 100 bytes, driven by eight client threads, and apart from a 2 GB block cache and a common log-sync setting all three stores ran with vendor defaults. Every number below comes from one machine. Each 10-million-key configuration was run five times, with runs of the different stores interleaved, and the figures quoted are medians unless stated otherwise. Throughput is given in thousands of operations per second. The full tables, the run log and the documentation excerpts we relied on are in the evidence appendix.

## Writes

Bulk insert is the workload that matters most for the ingestion service, so we start there. On the 10-million-key dataset, Marlin reached a median of 391 thousand operations per second on bulk insert, against 348 for StoneDB and 212 for KVLite. In relative terms, StoneDB's bulk-insert throughput was about 54 percent higher than KVLite's. Marlin's higher write throughput comes from its batched write-ahead log, which groups concurrent writes into a single append. Marlin's write advantage holds regardless of storage hardware or durability settings.

## Reads and latency

Random reads tell a different story. KVLite was the fastest store on random point reads, with a median of 455 thousand operations per second. Marlin also serves random reads faster than StoneDB. Under the mixed workload, KVLite's median p99 latency was 4.2 ms, the worst of the three, against 3.1 ms for StoneDB and 2.9 ms for Marlin. The p99 figures were computed over the full measured window of each run. The mixed workload used the same key and value sizes as the other two, with half of all operations being writes.

## Memory and scale

Speed came with a memory cost. Marlin's peak resident memory during bulk insert was 5.1 GB, the highest of the three stores. Peak memory was sampled once per second from the operating system's process statistics. We ran the 100-million-key test for bulk insert only. KVLite did not complete the 100M-key bulk insert in any of its three attempts, because the operating system terminated it for exhausting memory. Because the 100M-key comparison used only three runs per store, the gap between Marlin's 312 and StoneDB's 301 thousand operations per second should be treated as unresolved.

## Sustained operation and documentation

StoneDB sustains its mixed-workload throughput over long-running operation. As for what the projects say about themselves, Marlin's own documentation presents it as the right engine for write-intensive systems generally. Marlin is still a pre-release at version 0.9.2, so its on-disk format may change before 1.0.

## Next steps

We plan to publish the benchmark harness and the raw logs so that others can reproduce these figures. The appendix lists the software versions and configuration used, so that the run can be repeated.

## Evidence appendix

### A1. Test setup

| Item | Value |
|---|---|
| Host | One machine: 8-core x86-64 CPU, 32 GB RAM, NVMe SSD, Linux 6.1. No other hardware was used. |
| Versions | KVLite 4.2.1; StoneDB 2.8.0; Marlin 0.9.2 (pre-release) |
| Configuration | Vendor defaults, except (a) the block cache was fixed at 2 GB for every store and (b) the write-ahead log was synced in batches (fsync every 1,000 writes) for all three stores. Per-write fsync was not tested. |
| Data | 16-byte keys, 100-byte values, 8 client threads. Reads and mixed-workload operations used uniformly random keys. |
| Workload A | Bulk insert of sequential keys, run to completion. |
| Workload B | Random point reads over the preloaded 10M-key dataset: 60 s warm-up, then 5 minutes measured. |
| Workload C | Mixed, 50% reads and 50% writes: 60 s warm-up, then 5 minutes measured. |
| Replication | 10M keys: 5 runs per store and workload. 100M keys: 3 runs per store, workload A only. Runs of different stores were interleaved. |
| Metrics | Throughput in thousands of operations per second. p99 latency computed over the full 5-minute measured window from per-operation timings. Peak resident memory is the maximum of once-per-second samples of resident set size from the operating system's process statistics. |
| Who ran it | The authors' own team, using an in-house harness that is not yet published. No external reproduction has been done. |
| Instrumentation | No profiler, tracing or ablation runs were collected for any store. |
| Longest single run | Workload C, 6 minutes including warm-up. No soak or multi-hour run was performed. |

### A2. Throughput at 10M keys (thousand operations per second; median [min-max] of 5 runs)

| Workload | KVLite | StoneDB | Marlin |
|---|---|---|---|
| A, bulk insert | 212 [205-219] | 348 [341-352] | 391 [380-399] |
| B, random reads | 455 [448-463] | 402 [395-410] | 417 [391-426] |
| C, mixed 50/50 | 188 [180-195] | 266 [259-271] | 281 [262-290] |

### A3. p99 latency, workload C, 10M keys (ms; median [min-max] of 5 runs)

| KVLite | StoneDB | Marlin |
|---|---|---|
| 4.8 [4.5-5.2] | 3.1 [2.9-3.4] | 2.9 [2.7-3.2] |

### A4. Peak resident memory, workload A, 10M keys (GB; median of 5 runs)

| KVLite | StoneDB | Marlin |
|---|---|---|
| 1.9 | 3.4 | 5.1 |

### A5. Per-minute throughput during the five measured minutes of workload C, in the run with the median result (thousand operations per second)

| Store | Min 1 | Min 2 | Min 3 | Min 4 | Min 5 |
|---|---|---|---|---|---|
| KVLite | 190 | 188 | 186 | 189 | 187 |
| StoneDB | 262 | 265 | 266 | 268 | 270 |
| Marlin | 283 | 281 | 279 | 282 | 280 |

### A6. Bulk insert at 100M keys (workload A; thousand operations per second, individual runs)

| Store | Run 1 | Run 2 | Run 3 | Median [range] |
|---|---|---|---|---|
| StoneDB | 301 | 295 | 306 | 301 [295-306] |
| Marlin | 312 | 288 | 330 | 312 [288-330] |
| KVLite | killed | killed | killed | no result |

Run log excerpt (KVLite, 100M keys):

```
[kvlite][100M][run1] inserted=38,112,000 status=KILLED reason=oom-killer signal=9
[kvlite][100M][run2] inserted=41,560,000 status=KILLED reason=oom-killer signal=9
[kvlite][100M][run3] inserted=40,204,000 status=KILLED reason=oom-killer signal=9
```

Each of the three kernel logs for these runs contains the line "Out of memory: Killed process (kvlite_bench)".

### A7. Documentation excerpts

- Marlin README, section "Design goals", line 14: "Marlin is designed for write-intensive workloads whose reads mostly touch recently written keys."
- Marlin README, section "Write path", line 31: "Concurrent writes are grouped into a single log append before the sync."
- Marlin README, section "Status", line 3: "Marlin 0.9 is a pre-release; the on-disk format may change before 1.0."
