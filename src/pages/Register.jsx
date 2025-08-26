import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Form, Toast, Card, Typography } from '@douyinfe/semi-ui';
import { IconMail, IconLock, IconUser } from '@douyinfe/semi-icons';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const { email, password, confirmPassword, fullName } = values;
      
      if (password !== confirmPassword) {
        Toast.error('As senhas não coincidem');
        return;
      }
      
      const { error } = await signUp(email, password, {
        full_name: fullName
      });
      
      if (error) {
        Toast.error(error.message);
        return;
      }
      
      Toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      navigate('/login');
    } catch (error) {
      Toast.error('Erro inesperado. Tente novamente.');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
            🚀 Criar Conta
          </Title>
          <Paragraph type="tertiary">
            Junte-se ao DrawDB Enhanced
          </Paragraph>
        </div>

        <Form
          onSubmit={handleSubmit}
          style={{ width: '100%' }}
          labelPosition="inset"
        >
          <Form.Input
            field="fullName"
            label="Nome completo"
            placeholder="Seu nome completo"
            prefix={<IconUser />}
            rules={[
              { required: true, message: 'Nome é obrigatório' },
              { min: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
            ]}
            style={{ marginBottom: 16 }}
          />

          <Form.Input
            field="email"
            label="Email"
            placeholder="seu@email.com"
            prefix={<IconMail />}
            rules={[
              { required: true, message: 'Email é obrigatório' },
              { type: 'email', message: 'Email inválido' }
            ]}
            style={{ marginBottom: 16 }}
          />
          
          <Form.Input
            field="password"
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            prefix={<IconLock />}
            rules={[
              { required: true, message: 'Senha é obrigatória' },
              { min: 6, message: 'Senha deve ter pelo menos 6 caracteres' }
            ]}
            style={{ marginBottom: 16 }}
          />

          <Form.Input
            field="confirmPassword"
            label="Confirmar senha"
            type="password"
            placeholder="Digite a senha novamente"
            prefix={<IconLock />}
            rules={[
              { required: true, message: 'Confirmação de senha é obrigatória' },
            ]}
            style={{ marginBottom: 24 }}
          />

          <Button
            theme="solid"
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{ marginBottom: 16 }}
            size="large"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Link 
              to="/login"
              style={{ color: '#1890ff', textDecoration: 'none' }}
            >
              Já tem conta? Faça login
            </Link>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link 
              to="/"
              style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}
            >
              ← Voltar para página inicial
            </Link>
          </div>
        </Form>

        <div style={{ 
          marginTop: 24, 
          padding: '16px', 
          background: '#e8f5e8', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#2d5a2d'
        }}>
          <strong>✨ O que você ganha:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
            <li>Projetos salvos na nuvem</li>
            <li>Acesso de qualquer dispositivo</li>
            <li>Colaboração em tempo real</li>
            <li>AI para criar tabelas automaticamente</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}