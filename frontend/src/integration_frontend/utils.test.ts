import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('fusionne des classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('gère les valeurs conditionnelles', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('résout les conflits Tailwind', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('retourne une chaîne vide sans arguments', () => {
    expect(cn()).toBe('');
  });
});
