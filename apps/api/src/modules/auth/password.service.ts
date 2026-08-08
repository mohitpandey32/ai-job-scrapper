import bcrypt from "bcryptjs";

const passwordRounds = 12;

export class PasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, passwordRounds);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}

