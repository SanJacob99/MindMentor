import { test, describe } from 'node:test';
import assert from 'node:assert';
import { signupSchema } from '../src/schemas/authSchemas';
import { createEntrySchema } from '../src/schemas/entrySchemas';

describe('Schema Validation Limits', () => {
  describe('signupSchema', () => {
    test('rejects email longer than 255 chars', () => {
      const longEmail = 'a'.repeat(246) + '@test.com'; // 246 + 9 = 255 (valid)
      const tooLongEmail = 'a'.repeat(247) + '@test.com'; // 256 (invalid)

      const resultValid = signupSchema.safeParse({ email: longEmail, password: 'password123' });
      const resultInvalid = signupSchema.safeParse({ email: tooLongEmail, password: 'password123' });

      assert.strictEqual(resultValid.success, true);
      assert.strictEqual(resultInvalid.success, false);
    });

    test('rejects password longer than 100 chars', () => {
      const longPassword = 'a'.repeat(101);
      const result = signupSchema.safeParse({ email: 'test@test.com', password: longPassword });
      assert.strictEqual(result.success, false);
    });
  });

  describe('createEntrySchema', () => {
    test('rejects text longer than 20000 chars', () => {
      const longText = 'a'.repeat(20001);
      const result = createEntrySchema.safeParse({
        mood: 5,
        stress: 5,
        energy: 5,
        text: longText
      });
      assert.strictEqual(result.success, false);
    });

    test('rejects too many tags', () => {
      const manyTags = Array(11).fill('tag');
      const result = createEntrySchema.safeParse({
        mood: 5,
        stress: 5,
        energy: 5,
        tags: manyTags
      });
      assert.strictEqual(result.success, false);
    });

    test('rejects tags that are too long', () => {
      const longTag = 'a'.repeat(51);
      const result = createEntrySchema.safeParse({
        mood: 5,
        stress: 5,
        energy: 5,
        tags: [longTag]
      });
      assert.strictEqual(result.success, false);
    });
  });
});
