/**
 * PCM AudioWorklet Processor
 *
 * Runs inside the AudioWorkletGlobalScope (dedicated audio thread).
 * Batches 128-sample AudioWorklet frames into 1024-sample chunks (64ms @ 16kHz),
 * converts Float32 → Int16 PCM, and transfers the ArrayBuffer to the main thread
 * via a zero-copy postMessage. The main thread forwards it over WebSocket as raw
 * binary (no base64, no container format).
 *
 * Format contract:
 *   - Sample rate : 16 000 Hz  (AudioContext created with sampleRate: 16000)
 *   - Channels    : 1 (mono)
 *   - Bit depth   : 16-bit signed integer (Int16Array)
 *   - Chunk size  : 1024 samples = 2 048 bytes per message
 */

const BATCH_SIZE = 1024; // samples per outgoing message (~64 ms @ 16 kHz)

class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Pre-allocate a ring buffer; swap it out each time we post
        this._buf = new Float32Array(BATCH_SIZE);
        this._offset = 0;
    }

    /**
     * Called by the audio engine every ~128 samples.
     * @param {Float32Array[][]} inputs  - inputs[0][0] is the mono mic channel
     * @returns {boolean} true = keep processor alive
     */
    process(inputs) {
        const channel = inputs[0]?.[0];
        if (!channel) return true;

        for (let i = 0; i < channel.length; i++) {
            this._buf[this._offset++] = channel[i];

            if (this._offset >= BATCH_SIZE) {
                // Convert Float32 → Int16 in-place (saturated)
                const int16 = new Int16Array(BATCH_SIZE);
                for (let j = 0; j < BATCH_SIZE; j++) {
                    const s = Math.max(-1, Math.min(1, this._buf[j]));
                    int16[j] = s < 0 ? (s * 0x8000) : (s * 0x7FFF);
                }

                // Zero-copy transfer to main thread
                this.port.postMessage(int16.buffer, [int16.buffer]);
                this._offset = 0;
            }
        }

        return true;
    }
}

registerProcessor('pcm-processor', PCMProcessor);
