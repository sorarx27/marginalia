import tts

try:
    print("Testing synthesize_speech from tts.py...")
    audio = tts.synthesize_speech("Success! Liora's voice module is fully operational using Qwen three TTS Flash Real-time.")
    print(f"Success! Synthesized audio size: {len(audio)} bytes.")
    with open('module_output.mp3', 'wb') as f:
        f.write(audio)
    print("Saved audio to module_output.mp3.")
except Exception as e:
    print(f"Error testing tts.py: {e}")
