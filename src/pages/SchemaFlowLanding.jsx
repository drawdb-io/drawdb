import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Typography, Card, Avatar, Space, Collapse, Progress } from '@douyinfe/semi-ui';
import { IconChevronDown, IconCheck } from '@douyinfe/semi-icons';

const { Title, Paragraph } = Typography;

export default function SchemaFlowLanding() {
  const [animateStats, setAnimateStats] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimateStats(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const statistics = [
    { number: 10000, suffix: '+', label: 'Projetos Criados', color: '#3b82f6' },
    { number: 5000, suffix: '+', label: 'Usuários Ativos', color: '#10b981' },
    { number: 25000, suffix: '+', label: 'Tabelas Geradas', color: '#f59e0b' },
    { number: 99, suffix: '%', label: 'Satisfação', color: '#ef4444' }
  ];

  const faqs = [
    {
      question: 'O SchemaFlow é realmente gratuito?',
      answer: 'Sim! O SchemaFlow é 100% gratuito e open source. Você pode criar projetos ilimitados, colaborar com sua equipe e usar todas as funcionalidades sem nenhum custo.'
    },
    {
      question: 'Como funciona o Chat AI para gerar tabelas?',
      answer: 'Nosso Chat AI utiliza modelos de linguagem avançados para interpretar suas descrições em linguagem natural e gerar automaticamente estruturas de banco de dados completas com relacionamentos.'
    },
    {
      question: 'Posso exportar meus diagramas?',
      answer: 'Sim! Você pode exportar seus diagramas em diversos formatos: PNG, PDF, SQL (PostgreSQL, MySQL, SQLite), DBML e JSON. Perfeito para documentação e implementação.'
    },
    {
      question: 'Como funciona a colaboração em tempo real?',
      answer: 'Múltiplos usuários podem trabalhar no mesmo diagrama simultaneamente. Todas as mudanças são sincronizadas automaticamente via Supabase, permitindo colaboração fluida em equipe.'
    },
    {
      question: 'O que é o sistema de responsabilidades F,B,N,S?',
      answer: 'É um sistema único que permite classificar campos por responsabilidade: Frontend (F), Backend (B), Mobile (N) e Sistemas (S). Ideal para equipes multidisciplinares organizarem melhor seus projetos.'
    }
  ];

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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '70%',
        height: '120%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        transform: 'rotate(15deg)',
        animation: 'float 20s infinite linear'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-10%',
        width: '60%',
        height: '80%',
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />

      {/* Hero Section */}
      <div style={{ 
        padding: '100px 20px 80px',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        zIndex: 1
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

        <Space size="large" style={{ flexWrap: 'wrap' }}>
          <Link to="/register">
            <Button 
              theme="solid" 
              type="primary"
              size="large"
              style={{ 
                padding: '18px 36px',
                fontSize: '1.1rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 40px rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 32px rgba(255,255,255,0.2)';
              }}
            >
              🚀 Começar Gratuitamente
            </Button>
          </Link>
          
          <Link to="/login">
            <Button 
              theme="outline"
              type="primary"
              size="large"
              style={{ 
                padding: '18px 36px',
                fontSize: '1.1rem',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.4)',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.borderColor = 'rgba(255,255,255,0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
            >
              🔑 Fazer Login
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

      {/* Statistics Section */}
      <div style={{ 
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '64px', color: 'white' }}>
            📊 SchemaFlow em Numbers
          </Title>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            textAlign: 'center'
          }}>
            {statistics.map((stat, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div style={{ 
                  fontSize: '3.5rem', 
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: stat.color,
                  textShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                }}>
                  {animateStats ? (
                    <span>
                      {stat.number.toLocaleString()}{stat.suffix}
                    </span>
                  ) : (
                    <span>0{stat.suffix}</span>
                  )}
                </div>
                <Paragraph style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  fontSize: '1.1rem',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {stat.label}
                </Paragraph>
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60px',
                  height: '3px',
                  background: stat.color,
                  borderRadius: '2px',
                  boxShadow: `0 0 10px ${stat.color}40`
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div style={{ 
        padding: '80px 20px',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: '24px', color: '#1f2937' }}>
            🎥 Veja o SchemaFlow em Ação
          </Title>
          
          <Paragraph style={{ 
            fontSize: '1.2rem',
            color: '#6b7280',
            marginBottom: '48px',
            maxWidth: '600px',
            margin: '0 auto 48px'
          }}>
            Do conceito à implementação em minutos, não horas
          </Paragraph>

          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '20px',
            padding: '60px 40px',
            border: '2px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Placeholder para demo/screenshot */}
            <div style={{
              width: '100%',
              height: '400px',
              background: 'linear-gradient(145deg, #667eea, #764ba2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚀</div>
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                  Interface Intuitiva
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0' }}>
                  Drag & Drop • Chat AI • Colaboração Real-time
                </Paragraph>
              </div>
              
              {/* Elementos decorativos */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#f59e0b',
                boxShadow: '0 0 8px #f59e0b'
              }} />
            </div>
            
            <div style={{
              marginTop: '32px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '24px'
            }}>
              {['🎯 Fácil de Usar', '⚡ Super Rápido', '🔒 100% Seguro', '🌟 Open Source'].map((feature, i) => (
                <div key={i} style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0'
                }}>
                  <Paragraph style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>
                    {feature}
                  </Paragraph>
                </div>
              ))}
            </div>
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

      {/* FAQ Section */}
      <div style={{ 
        padding: '80px 20px',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '64px', color: '#1f2937' }}>
            ❓ Perguntas Frequentes
          </Title>
          
          <Collapse ghost>
            {faqs.map((faq, index) => (
              <Collapse.Panel
                key={index}
                header={
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '8px 0'
                  }}>
                    <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                      {faq.question}
                    </Title>
                  </div>
                }
                itemKey={index.toString()}
                style={{
                  marginBottom: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                  padding: '20px 24px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <Paragraph style={{ 
                    color: '#374151', 
                    lineHeight: 1.7,
                    margin: 0,
                    fontSize: '1rem'
                  }}>
                    {faq.answer}
                  </Paragraph>
                </div>
              </Collapse.Panel>
            ))}
          </Collapse>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Paragraph style={{ color: '#6b7280', marginBottom: '24px' }}>
              Ainda tem dúvidas? Entre em contato conosco!
            </Paragraph>
            <Button 
              theme="outline"
              type="primary"
              size="large"
              style={{ 
                padding: '12px 32px',
                borderRadius: '8px',
                borderColor: '#3b82f6',
                color: '#3b82f6'
              }}
            >
              💬 Falar Conosco
            </Button>
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
        padding: '60px 20px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'rgba(255,255,255,0.8)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <Title level={3} style={{ color: 'white', marginBottom: '12px' }}>
              🚀 SchemaFlow
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
              A nova geração de design de banco de dados
            </Paragraph>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '32px',
            marginBottom: '48px',
            textAlign: 'left'
          }}>
            <div>
              <Title level={5} style={{ color: 'white', marginBottom: '16px' }}>
                Produto
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/features" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  ⚡ Funcionalidades
                </Link>
                <Link to="/pricing" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  💰 Preços
                </Link>
                <Link to="/docs" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  📚 Documentação
                </Link>
              </div>
            </div>

            <div>
              <Title level={5} style={{ color: 'white', marginBottom: '16px' }}>
                Empresa
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  🏢 Sobre Nós
                </a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  📧 Contato
                </a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  💼 Carreiras
                </a>
              </div>
            </div>

            <div>
              <Title level={5} style={{ color: 'white', marginBottom: '16px' }}>
                Comunidade
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  🔗 GitHub
                </a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  💬 Discord
                </a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  🐦 Twitter
                </a>
              </div>
            </div>

            <div>
              <Title level={5} style={{ color: 'white', marginBottom: '16px' }}>
                Legal
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  📜 Termos de Uso
                </a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  🔒 Privacidade
                </a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  🍪 Cookies
                </a>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <Paragraph style={{ margin: 0, color: 'rgba(255,255,255,0.6)' }}>
              © 2025 SchemaFlow - Desenvolvido com ❤️ para a comunidade de desenvolvedores
            </Paragraph>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>🌟 Open Source</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>🚀 Made in Brazil</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: rotate(15deg) translateX(0px) translateY(0px); }
          25% { transform: rotate(15deg) translateX(20px) translateY(-10px); }
          50% { transform: rotate(15deg) translateX(0px) translateY(-20px); }
          75% { transform: rotate(15deg) translateX(-20px) translateY(-10px); }
          100% { transform: rotate(15deg) translateX(0px) translateY(0px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem !important;
          }
          
          .hero-subtitle {
            font-size: 1.2rem !important;
          }
        }
      `}</style>
    </div>
  );
}