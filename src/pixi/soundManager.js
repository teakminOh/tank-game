import { Howl, Howler } from 'howler';

const backgroundMusic = new Howl({
    src: ['sounds/game-music.mp3', 'sounds/game-music.ogg'],
    loop: true,
    volume: 0.5,
});

const tankMoveSound = new Howl({
    src: ['sounds/tank-move.mp3', 'sounds/tank-move.ogg'],
    loop: true,
    volume: 0.1,
});

const fireSound = new Howl({
    src: ['sounds/tank-fire.mp3', 'sounds/tank-fire.ogg'],
    volume: 1.0,
});

const explosionSound = new Howl({
    src: ['sounds/tank-explosion.mp3', 'sounds/tank-explosion.ogg'],
    volume: 0.8,
});

// Export the sounds for use in other files
export const sounds = {
    tankMove: tankMoveSound,
    fire: fireSound,
    explosion: explosionSound,
    music: backgroundMusic
};


// Function to unlock audio
export function unlockAudio() {
    if (Howler.ctx.state === "suspended") {
        Howler.ctx.resume().then(() => {
            console.log("AudioContext resumed after user interaction.");
        });
    }
}

// Example usage: Call `unlockAudio()` on any user gesture
window.addEventListener("click", unlockAudio);
window.addEventListener("keydown", unlockAudio);
