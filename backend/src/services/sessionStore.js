const sessions = new Map();

function createDefaultSession(sessionId) {
    return {
        sessionId,
        currentTask: "",
        lastScreenSummary: "",
        lastNextAction: "",
        lastWarning: "",
        confidence: "Medium",
        history: [],
        updatedAt: new Date().toISOString()
    };
}

export function getSession(sessionId) {
    if (!sessionId) {
        return createDefaultSession("anonymous");
    }

    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, createDefaultSession(sessionId));
    }

    return sessions.get(sessionId);
}

export function updateSession(sessionId, patch) {
    const existing = getSession(sessionId);

    const updated = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString()
    };

    sessions.set(sessionId, updated);
    return updated;
}

export function appendSessionHistory(sessionId, entry) {
    const session = getSession(sessionId);

    const history = Array.isArray(session.history) ? session.history : [];
    const nextHistory = [
        ...history,
        {
            ...entry,
            timestamp: new Date().toISOString()
        }
    ].slice(-8);

    return updateSession(sessionId, { history: nextHistory });
}

export function resetSession(sessionId) {
    const fresh = createDefaultSession(sessionId);
    sessions.set(sessionId, fresh);
    return fresh;
}

export function getSessionSummary(sessionId) {
    const session = getSession(sessionId);

    return {
        currentTask: session.currentTask,
        lastScreenSummary: session.lastScreenSummary,
        lastNextAction: session.lastNextAction,
        lastWarning: session.lastWarning,
        confidence: session.confidence,
        history: session.history,
        updatedAt: session.updatedAt
    };
}