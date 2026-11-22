"""Step 1: synthesize one narration clip per scene and record exact durations."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE = "en-US-ChristopherNeural"
PAD = 1.0  # seconds of silence kept after every sentence

scenes = json.loads((ROOT / "scripts" / "scenes.json").read_text())
audio_dir = ROOT / "audio"
audio_dir.mkdir(exist_ok=True)
for old in audio_dir.glob("*.mp3"):
    old.unlink()

durations = {}
for sc in scenes:
    out = audio_dir / f"{sc['id']}.mp3"
    subprocess.run(
        ["python3", "-m", "edge_tts", "--voice", VOICE, "--rate=+10%", "--text", sc["text"], "--write-media", str(out)],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    d = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(out)]).decode().strip())
    durations[sc["id"]] = d
    print(f"{sc['id']}: {d:.2f}s")

(ROOT / "scripts" / "durations.json").write_text(json.dumps({"pad": PAD, "durations": durations}, indent=2))
total = sum(durations.values()) + PAD * len(durations)
print(f"Estimated video length: {total:.0f}s ({total/60:.1f} min)")
