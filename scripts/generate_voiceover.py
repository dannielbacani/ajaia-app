import os
import subprocess
import json

VOICE = "en-US-ChristopherNeural"

SCENES = [
    {
        "id": "s1",
        "text": "Welcome to Ajaia Docs, an AI-native collaborative editor built by Danniel Bacani. The Reviewer Persona Switcher lets us test cross-user permissions in one click.",
        "start": 0.5,
    },
    {
        "id": "s2",
        "text": "Switching to Bob Smith reveals his separate workspace, with clear visual distinction between owned and shared documents.",
        "start": 7.0,
    },
    {
        "id": "s3",
        "text": "Switching back to Danniel, we create a new document with instant inline title synchronization.",
        "start": 13.0,
    },
    {
        "id": "s4",
        "text": "Our TipTap rich text canvas supports Headings, Bold, Italic, Underline, and bulleted lists for a smooth editing experience.",
        "start": 19.0,
    },
    {
        "id": "s5",
        "text": "Every edit autosaves to Neon PostgreSQL within 800 milliseconds, and documents can be exported to Markdown anytime.",
        "start": 29.0,
    },
    {
        "id": "s6",
        "text": "Our file ingestion engine parses uploaded Markdown files directly into structured, editable documents.",
        "start": 35.0,
    },
    {
        "id": "s7",
        "text": "Danniel opens the sharing dialog and grants Bob Smith editor permissions, updating relational access in real time.",
        "start": 42.0,
    },
    {
        "id": "s8",
        "text": "Bob receives the document in Shared with Me and contributes a note, while uninvited personas like Charlie have zero access.",
        "start": 49.0,
    },
]

def main():
    audio_dir = "/Users/jezreelgaudia/Documents/Tasks/ajaia-app/audio"
    os.makedirs(audio_dir, exist_ok=True)

    print("Generating AI voiceover audio clips with edge-tts...")
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
        clips.append({"file": out_file, "start": sc["start"]})
        print(f"Generated {sc['id']}.mp3")

    # Build an FFmpeg filter_complex command to place each audio clip at its specific start time
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
    print(f"Master voiceover generated at: {mixed_audio}")

    # Now merge master audio with the video
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

    # Overwrite master video
    os.replace(temp_video, raw_video)
    print(f"\nFinal video with AI Voiceover and cursor pointer complete: {raw_video}")

if __name__ == "__main__":
    main()
