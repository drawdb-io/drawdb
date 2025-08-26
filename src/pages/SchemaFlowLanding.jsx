import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Typography, Card, Avatar, Space } from '@douyinfe/semi-ui';
// Removidos ícones problemáticos, usando emojis

const { Title, Paragraph } = Typography;

export default function SchemaFlowLanding() {
  const features = [
    {
      icon: <div style={{ fontSize: '3rem' }}>🗄️</div>,
      title: 'Design Visual de Banco',
      description: 'Crie diagramas de banco de dados de forma intuitiva com drag & drop'
    },
    {
      icon: <div style={{ fontSize: '3rem' }}>🤖</div>,
      title: 'Chat AI Inteligente',
      description: 'Use IA para gerar tabelas e estruturas automaticamente'
    },
    {
      icon: <div style={{ fontSize: '3rem' }}>🔗</div>,
      title: 'Colaboração em Tempo Real',
      description: 'Trabalhe em equipe com sincronização automática'
    },
    {
      icon: <div style={{ fontSize: '3rem' }}>⚡</div>,
      title: 'Sistema de Responsabilidades',
      description: 'Organize campos por Frontend, Backend, Mobile e Sistemas'
    }
  ];

  const testimonials = [
    {
      name: 'Ana Silva',
      role: 'Tech Lead',
      avatar: 'AS',
      text: 'SchemaFlow revolucionou nosso processo de design de banco de dados!'
    },
    {
      name: 'Carlos Santos',
      role: 'Arquiteto de Software',
      avatar: 'CS', 
      text: 'A funcionalidade de Chat AI economiza horas de trabalho manual.'
    },
    {
      name: 'Marina Costa',
      role: 'Desenvolvedora Full Stack',
      avatar: 'MC',
      text: 'Colaboração em tempo real mudou como nossa equipe trabalha.'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Hero Section */}
      <div style={{ 
        padding: '80px 20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <Title level={1} style={{ 
          color: 'white', 
          fontSize: '4rem',
          marginBottom: '24px',
          fontWeight: 'bold'
        }}>
          🚀 SchemaFlow
        </Title>
        
        <Paragraph style={{ 
          fontSize: '1.5rem', 
          color: 'rgba(255,255,255,0.9)',
          maxWidth: '800px',
          margin: '0 auto 48px'
        }}>
          A próxima geração de design de banco de dados com IA, colaboração em tempo real e sistema inteligente de responsabilidades
        </Paragraph>

        <Space size="large">
          <Link to="/register">
            <Button 
              theme="solid" 
              type="primary"
              size="large"
              style={{ 
                padding: '16px 32px',
                fontSize: '1.1rem',
                background: 'white',
                color: '#667eea',
                border: 'none'
              }}
            >
              🎯 Começar Gratuitamente
            </Button>
          </Link>
          
          <Link to="/login">
            <Button 
              theme="borderless"
              type="primary"
              size="large"
              style={{ 
                padding: '16px 32px',
                fontSize: '1.1rem',
                color: 'white',
                borderColor: 'white'
              }}
            >
              📱 Fazer Login
            </Button>
          </Link>
        </Space>

        <div style={{ marginTop: '32px', opacity: 0.8 }}>
          <Space>
            <span>⭐</span>
            <span>100% Gratuito</span>
            <span>👥</span>
            <span>Colaboração Ilimitada</span>
            <span>📂</span>
            <span>Open Source</span>
          </Space>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        padding: '80px 20px',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '64px', color: '#1f2937' }}>
            ⚡ Funcionalidades Poderosas
          </Title>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px'
          }}>
            {features.map((feature, index) => (
              <Card
                key={index}
                style={{ 
                  padding: '32px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s',
                }}
                bodyStyle={{ padding: 0 }}
                hoverable
              >
                <div style={{ marginBottom: '24px' }}>
                  {feature.icon}
                </div>
                <Title level={4} style={{ marginBottom: '16px', color: '#1f2937' }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ color: '#6b7280', lineHeight: 1.6 }}>
                  {feature.description}
                </Paragraph>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div style={{ 
        padding: '80px 20px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '64px', color: '#1f2937' }}>
            💬 O que dizem nossos usuários
          </Title>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                style={{ 
                  padding: '24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px'
                }}
                bodyStyle={{ padding: 0 }}
              >
                <Space direction="vertical" align="start">
                  <Space>
                    <Avatar style={{ backgroundColor: '#667eea' }}>
                      {testimonial.avatar}
                    </Avatar>
                    <div>
                      <Title level={5} style={{ margin: 0, color: '#1f2937' }}>
                        {testimonial.name}
                      </Title>
                      <Paragraph style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                        {testimonial.role}
                      </Paragraph>
                    </div>
                  </Space>
                  <Paragraph style={{ color: '#374151', fontStyle: 'italic' }}>
                    "{testimonial.text}"
                  </Paragraph>
                </Space>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        textAlign: 'center'
      }}>
        <Title level={2} style={{ color: 'white', marginBottom: '24px' }}>
          🎯 Pronto para revolucionar seu workflow?
        </Title>
        
        <Paragraph style={{ 
          fontSize: '1.2rem',
          color: 'rgba(255,255,255,0.8)',
          marginBottom: '48px',
          maxWidth: '600px',
          margin: '0 auto 48px'
        }}>
          Junte-se a milhares de desenvolvedores que já usam SchemaFlow para criar bancos de dados incríveis
        </Paragraph>

        <Link to="/register">
          <Button 
            theme="solid"
            type="primary"
            size="large"
            style={{ 
              padding: '20px 40px',
              fontSize: '1.2rem',
              background: '#3b82f6',
              borderRadius: '12px'
            }}
          >
            🚀 Começar Agora - É Grátis!
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '40px 20px',
        backgroundColor: '#111827',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.6)'
      }}>
        <Paragraph style={{ margin: 0, color: 'rgba(255,255,255,0.6)' }}>
          © 2025 SchemaFlow - Desenvolvido com ❤️ para a comunidade de desenvolvedores
        </Paragraph>
      </div>
    </div>
  );
}