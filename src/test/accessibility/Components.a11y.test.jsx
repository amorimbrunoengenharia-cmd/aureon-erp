import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';

expect.extend(toHaveNoViolations);

describe('Accessibility Audit - Core Components', () => {
  describe('Button Component', () => {
    it('deve não ter violações de acessibilidade', async () => {
      const { container } = render(
        <Button variant="primary">Click me</Button>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('deve ter role implícito de button', () => {
      const { getByRole } = render(
        <Button variant="primary">Submit</Button>
      );
      
      expect(getByRole('button')).toBeInTheDocument();
    });

    it('deve suportar focus com teclado', () => {
      const { getByRole } = render(
        <Button variant="primary">Focus me</Button>
      );
      
      const button = getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Input Component', () => {
    it('deve não ter violações de acessibilidade', async () => {
      const { container } = render(
        <Input label="Nome" placeholder="Digite seu nome" />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('deve associar label ao input', () => {
      const { getByLabelText } = render(
        <Input label="Email" placeholder="Digite seu email" />
      );
      
      expect(getByLabelText('Email')).toBeInTheDocument();
    });

    it('deve ter placeholder acessível', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Digite seu nome" />
      );
      
      expect(getByPlaceholderText('Digite seu nome')).toBeInTheDocument();
    });
  });

  describe('Card Component', () => {
    it('deve não ter violações de acessibilidade', async () => {
      const { container } = render(
        <Card>
          <h2>Card Title</h2>
          <p>Card content</p>
        </Card>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('deve renderizar conteúdo interno corretamente', () => {
      const { getByText } = render(
        <Card>
          <h2>Test Card</h2>
        </Card>
      );
      
      expect(getByText('Test Card')).toBeInTheDocument();
    });
  });

  describe('Focus States', () => {
    it('Button deve ter classe focus-aureon', () => {
      const { container } = render(
        <Button variant="primary">Focus Test</Button>
      );
      
      const button = container.querySelector('button');
      expect(button.className).toContain('focus-aureon');
    });

    it('Input deve ter classe focus-aureon', () => {
      const { container } = render(
        <Input placeholder="Focus test" />
      );
      
      const input = container.querySelector('input');
      expect(input.className).toContain('focus-aureon');
    });
  });

  describe('Color Contrast', () => {
    it('deve usar CSS tokens com contraste WCAG AA', async () => {
      const { container } = render(
        <div style={{ 
          background: 'var(--aureon-bg)', 
          color: 'var(--aureon-text)' 
        }}>
          <p>Teste de contraste</p>
        </div>
      );
      
      // axe vai verificar contraste automaticamente
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
