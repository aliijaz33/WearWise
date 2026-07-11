// Admin service - persists Help & Support contact messages to the admin table.

import { supabase } from './supabase';

export interface AdminMessageInput {
  subject: string;
  message: string;
}

export const adminService = {
  // Inserts a support message (subject + body) into the admin table. Returns true/false.
  async create(
    userId: string | null,
    email: string | null,
    input: AdminMessageInput,
  ): Promise<boolean> {
    const { error } = await supabase.from('admin').insert({
      user_id: userId,
      email,
      subject: input.subject,
      message: input.message,
    });

    return !error;
  },
};
