/**
 * Teste básico de configuração
 */

describe('Basic Configuration', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have test environment setup', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have JWT secrets configured', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_REFRESH_SECRET).toBeDefined();
  });
});
