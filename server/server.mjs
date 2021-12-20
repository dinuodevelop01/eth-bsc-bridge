import cluster from "node:cluster";
import os from "node:os";

const CPU_COUNT = os.cpus().length;

cluster.setupPrimary({
  exec: "server/worker.mjs",
});

// Fork workers.
for (let i = 0; i < CPU_COUNT; i++) {
  fork();
}

function fork() {
  let startedListening = false;
  const worker = cluster.fork();
  worker.on("exit", () => {
    if (startedListening) fork();
  });
  worker.on("listening", (addr) => {
    startedListening = true;
    console.log(
      `worker ${worker.id} (pid ${worker.process.pid}) listening on port ${addr.port}...`
    );
  });
}
