"""Step 3: place each narration clip at its recorded scene start and mux into the MP4.

Because the recorder waits for each clip's measured duration + pad before starting
the next scene, clips can never overlap. The final video is never shortened to the
audio (no -shortest), so nothing is cut off.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
starts = json.loads((ROOT / "scripts" / "scene_starts.json").read_text())
meta = json.loads((ROOT / "scripts" / "durations.json").read_text())
durs = meta["durations"]
ids = list(starts.keys())

# Safety check: no two clips overlap.
for a, b in zip(ids, ids[1:]):
    end_a = starts[a] + durs[a]
    assert end_a < starts[b], f"{a} ends {end_a:.2f}s after {b} starts {starts[b]:.2f}s"

inputs, parts = [], []
for i, sid in enumerate(ids):
    inputs += ["-i", str(ROOT / "audio" / f"{sid}.mp3")]
    ms = int(starts[sid] * 1000)
    parts.append(f"[{i}:a]adelay={ms}|{ms}[a{i}]")
mix = "".join(f"[a{i}]" for i in range(len(ids)))
fc = ";".join(parts) + f";{mix}amix=inputs={len(ids)}:normalize=0[aout]"

master = ROOT / "audio" / "full_voiceover.mp3"
subprocess.run(["ffmpeg", "-y", *inputs, "-filter_complex", fc, "-map", "[aout]",
                "-c:a", "libmp3lame", "-b:a", "192k", str(master)], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

silent = ROOT / "videos" / "silent.mp4"
final = ROOT / "ajaia_walkthrough_demo.mp4"
subprocess.run(["ffmpeg", "-y", "-i", str(silent), "-i", str(master),
                "-c:v", "copy", "-c:a", "aac", "-ar", "44100", "-b:a", "192k",
                "-movflags", "+faststart", str(final)], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "default=nw=1:nk=1", str(p)]).decode().strip())


v, a = dur(silent), dur(master)
last_end = starts[ids[-1]] + durs[ids[-1]]
print(f"video {v:.1f}s | last narration ends {last_end:.1f}s | master audio {a:.1f}s")
assert v > last_end + 0.5, "video would cut off the last sentence"
print(f"OK -> {final} ({dur(final)/60:.2f} min)")
