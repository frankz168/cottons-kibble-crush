export class IGameRepository {
    saveScore(score) {
        throw new Error("Method 'saveScore' must be implemented.");
    }

    loadScore() {
        throw new Error("Method 'loadScore' must be implemented.");
    }
}
