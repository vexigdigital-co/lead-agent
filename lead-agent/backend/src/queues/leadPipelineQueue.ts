import { runLeadPipeline } from '../agents/pipeline'

// ─── In-memory async queue (no Redis needed for local dev) ────────────────────
// Behaves like BullMQ: jobs are dispatched and processed asynchronously
// so the user's chat response is never blocked by slow AI calls.

type PipelineJob = { leadId: string }

class InMemoryQueue {
  private processing = false
  private queue: PipelineJob[] = []

  async add(name: string, data: PipelineJob) {
    this.queue.push(data)
    console.log(`[pipeline-queue] Job added: ${name} for lead ${data.leadId}`)
    // Process without blocking the caller
    this.drain()
  }

  private async drain() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      try {
        await this.processJob(job)
      } catch (err) {
        console.error(`[pipeline-queue] Job failed for lead ${job.leadId}`, err)
      }
    }

    this.processing = false
  }

  private async processJob(job: PipelineJob) {
    await runLeadPipeline(job.leadId)
  }
}

export const leadPipelineQueue = new InMemoryQueue()
