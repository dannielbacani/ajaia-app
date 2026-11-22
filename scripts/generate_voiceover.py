import os
import subprocess

VOICE = "en-US-ChristopherNeural"

# Exactly timed, non-overlapping scene scripts
SCENES = [
    {
        "id": "s1",
        "text": "Welcome to Ajaia Docs, built by Danniel Bacani. The Reviewer Switcher tests permissions in one click.",
        "start": 0.5,
    },
    {
        "id": "s2",
        "text": "Switching to Bob Smith shows his workspace, separating owned documents from shared ones.",
        "start": 9.2,
    },
    {
        "id": "s3",
        "text": "Switching back to Danniel, we create a new document with instant title syncing.",
        "start": 16.5,
    },
    {
        "id": "s4",
        "text": "The TipTap editor supports Headings, Bold, Italic, Underline, and lists for a smooth writing flow.",
        "start": 23.0,
    },
    {
        "id": "s5",
        "text": "Edits autosave to Neon PostgreSQL in 800 milliseconds, and can be exported anytime.",
        "start": 32.0,
    },
    {
        "id": "s6",
        "text": "Our ingestion engine converts uploaded Markdown files directly into editable drafts.",
        "start": 40.0,
    },
    {
        "id": "s7",
        "text": "Danniel opens the sharing dialog and grants Bob editor access in real time.",
        "start": 47.0,
    },
    {
        "id": "s8",
        "text": "Bob opens the shared document and contributes, while uninvited personas have zero access.",
        "start": 54.0,
    },
]

def main():
    audio_dir = "/Users/jezreelgaudia/Documents/Tasks/ajaia-app/audio"
    os.makedirs(audio_dir, exist_ok=True)

    print("Generating non-overlapping AI voiceover audio clips...")
    clips = []
    for sc in SCENES:
        out_file = os.path.join(audio_dir, f"{sc['id']}.mp3")
        cmd = [
            "python3", "-m", "edge_tts",
            "--voice", VOICE,
            "--text", sc["text"],
            "--write-media", out_file
        ]
        subprocess.run(cmd, check=True)
        dur = float(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", out_file
        ]).decode().strip())
        print(f"Generated {sc['id']}.mp3 ({dur:.2f}s) starting at {sc['start']}s -> ends at {sc['start'] + dur:.2f}s")
        clips.append({"file": out_file, "start": sc["start"]})

    # Build FFmpeg filter_complex command
    inputs = []
    filter_parts = []
    for i, clip in enumerate(clips):
        inputs.extend(["-i", clip["file"]])
        delay_ms = int(clip["start"] * 1000)
        filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}]")

    mix_inputs = "".join(f"[a{i}]" for i in range(len(clips)))
    filter_complex = f"{';'.join(filter_parts)};{mix_inputs}amix=inputs={len(clips)}:normalize=0[aout]"

    mixed_audio = os.path.join(audio_dir, "full_voiceover.mp3")
    mix_cmd = ["ffmpeg", "-y"] + inputs + ["-filter_complex", filter_complex, "-map", "[aout]", "-c:a", "libmp3lame", "-b:a", "192k", mixed_audio]
    print("Mixing voiceover tracks into master audio...")
    subprocess.run(mix_cmd, check=True)

    raw_video = "/Users/jezreelgaudia/Documents/Tasks/ajaia-app/ajaia_walkthrough_demo.mp4"
    temp_video = "/Users/jezreelgaudia/Documents/Tasks/ajaia-app/ajaia_walkthrough_with_voice.mp4"

    merge_cmd = [
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", mixed_audio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        temp_video
    ]
    print("Muxing video and audio tracks...")
    subprocess.run(merge_cmd, check=True)
    os.replace(temp_video, raw_video)
    print(f"\nFinal video complete with zero audio overlap: {raw_video}")

if __name__ == "__main__":
    main()
