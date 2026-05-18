import { executePipeline } from './agents';
import { getTask, updateTaskStatus } from './db';
import { sendMessage } from './bot';

type Job = { 
  taskId: string;
  modelId: string;
};

class TaskQueue {
  private queue: Job[] = [];
  private activeCount = 0;
  // Allows multiple background workers simultaneously
  private concurrency = 5;

  async add(job: Job) {
    this.queue.push(job);
    await updateTaskStatus(job.taskId, 'queued');
    this.process();
  }

  private async process() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) return;
    
    this.activeCount++;
    const job = this.queue.shift()!;
    
    try {
      // Execute the task via AI agent pipeline
      const task = await getTask(job.taskId);
      if (!task) throw new Error("Task not found");
      
      await executePipeline(task, job.modelId);
      
    } catch (e: any) {
      console.error(`Task queue error for ${job.taskId}:`, e);
      await updateTaskStatus(job.taskId, 'failed');
      
      const task = await getTask(job.taskId);
      if (task?.chat_id) {
        await sendMessage(task.chat_id, `Task failed: ${e.message}`);
      }
    } finally {
      this.activeCount--;
      // Try to process the next item in the queue
      this.process();
    }
  }
}

export const taskQueue = new TaskQueue();
