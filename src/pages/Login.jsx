import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Form, Toast, Card, Typography } from '@douyinfe/semi-ui';
import { IconMail, IconLock } from '@douyinfe/semi-icons';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const { email, password } = values;
      
      const { error } = await signIn(email, password);
      
      if (error) {
        Toast.error(error.message);
        return;
      }
      
      Toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      Toast.error('Erro inesperado. Tente novamente.');
      console.error('Login error:', error);
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
            🎨 DrawDB Enhanced
          </Title>
          <Paragraph type="tertiary">
            Faça login para gerenciar seus projetos
          </Paragraph>
        </div>

        <Form
          onSubmit={handleSubmit}
          style={{ width: '100%' }}
          labelPosition="inset"
        >
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
            placeholder="Digite sua senha"
            prefix={<IconLock />}
            rules={[
              { required: true, message: 'Senha é obrigatória' },
              { min: 6, message: 'Senha deve ter pelo menos 6 caracteres' }
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
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Link 
              to="/register"
              style={{ color: '#1890ff', textDecoration: 'none' }}
            >
              Não tem conta? Cadastre-se
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
          background: '#f8f9fa', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>🚀 Recursos disponíveis:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
            <li>Chat AI para criar tabelas</li>
            <li>Sistema de responsabilidades F,B,N,S</li>
            <li>Auto-save no Supabase</li>
            <li>Colaboração em tempo real</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}