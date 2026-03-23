import { Keypair } from "@stellar/stellar-sdk";

export interface Session {
  keypair: Keypair;
  expiresAt: number;
}

export class SessionManager {
  private session: Session | null = null;

  createSession(durationMs: number): Session {
    const keypair = Keypair.random();

    this.session = {
      keypair,
      expiresAt: Date.now() + durationMs,
    };

    return this.session;
  }

  getSession(): Session | null {
    if (!this.session) return null;

    if (Date.now() > this.session.expiresAt) {
      this.session = null;
      return null;
    }

    return this.session;
  }

  clearSession(): void {
    this.session = null;
  }
}
