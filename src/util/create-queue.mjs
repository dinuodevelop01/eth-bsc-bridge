/**
 * A serial execution queue based on Promises.
 *
 * @returns {Queue}
 */
function createQueue() {
  const queue = [];

  queue.head = Promise.resolve();
  queue.push = (fn) => {
    Array.prototype.push.call(queue, fn);
    queue.head = queue.head.then(async () => {
      // Verify whether or not the function was prematurely removed from the queue.
      if (!queue.includes(fn)) return;

      let error;
      try {
        await fn();
      } catch (e) {
        error = e;
      }

      queue.shift();
      if (error) {
        // Must ensure that the head of the queue is not the error from before.
        queue.head = Promise.resolve();
        throw error;
      }
    });
    return queue.head;
  };

  return queue;
}

export default createQueue;
