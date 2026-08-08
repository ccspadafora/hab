import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'HAB — Alternativa a vender su casa en Bogotá',
  description: '¿Su casa lleva meses publicada sin venderse? Descubra el modelo de aporte inmobiliario de HAB. Sin banco, sin espera. Miles de propietarios en Bogotá ya lo conocen.',
  openGraph: {
    title:       'Su casa puede valer más · HAB Colombia',
    description: 'El modelo de aporte inmobiliario: cambia tu casa por un apartamento nuevo.',
    images:      [{ url: '/og-propietarios.jpg', width: 1200, height: 630 }],
  },
}

// Server Component — no 'use client'
export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <ProblemaSection />
      <ComoFuncionaSection />
      <ComparativaSection />
      <TestimoniosSection />
      <FaqSection />
      <CtaFinalSection />
    </main>
  )
}

// ──────────────────────────────────────────────────
// HERO SECTION
// ──────────────────────────────────────────────────
function HeroSection() {
  return (
    <section style={{
      background:    'var(--hab-verde)',
      minHeight:     '100vh',
      display:       'grid',
      gridTemplateColumns: '1fr 1fr',
      paddingTop:    '72px',
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* Left — content */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        justifyContent:'center',
        padding:       'clamp(40px,5vw,96px) clamp(20px,5vw,80px)',
        zIndex:        2,
      }}>
        {/* Tag */}
        <div style={{
          fontSize:     '9px',
          fontWeight:   600,
          letterSpacing:'4px',
          textTransform:'uppercase',
          color:        'var(--hab-amarillo)',
          marginBottom: '22px',
          display:      'flex',
          alignItems:   'center',
          gap:          '10px',
        }}>
          <span style={{display:'block',width:'32px',height:'1px',background:'var(--hab-amarillo)'}}/>
          Proptech · Colombia · 2025
        </div>

        {/* H1 */}
        <h1 style={{
          fontFamily:   'var(--font-display)',
          fontWeight:   900,
          fontSize:     'clamp(44px,6.5vw,82px)',
          lineHeight:   0.9,
          color:        'var(--hab-blanco)',
          textTransform:'uppercase',
          marginBottom: '24px',
        }}>
          Su casa puede<br />
          valer mucho<br />
          <span style={{color:'var(--hab-amarillo)'}}>más</span>
        </h1>

        {/* Description */}
        <p style={{
          fontFamily:  'var(--font-body)',
          fontSize:    '14px',
          fontWeight:  300,
          lineHeight:  1.8,
          color:       'rgba(255,255,255,0.7)',
          maxWidth:    '440px',
          marginBottom:'36px',
        }}>
          Conózcanos antes de vender. Miles de propietarios en Bogotá
          ya descubrieron una mejor alternativa.
        </p>

        {/* CTAs */}
        <div style={{display:'flex', gap:'16px', flexWrap:'wrap'}}>
          <a href="/registro/paso-1" className="btn-primary">
            Publicar mi inmueble gratis
          </a>
          <a href="/como-funciona" className="btn-secondary" style={{
            color:'var(--hab-amarillo)',
            borderColor:'var(--hab-amarillo)',
          }}>
            ¿Cómo funciona?
          </a>
        </div>

        {/* Trust badges */}
        <div style={{
          display:     'flex',
          gap:         '20px',
          marginTop:   '36px',
          flexWrap:    'wrap',
        }}>
          {['Empresa colombiana','Sin costo para el propietario','Garantías legales'].map((badge) => (
            <span key={badge} style={{
              fontFamily:  'var(--font-body)',
              fontSize:    '10px',
              fontWeight:  400,
              color:       'rgba(255,255,255,0.5)',
              display:     'flex',
              alignItems:  'center',
              gap:         '6px',
            }}>
              <span style={{
                width:           '6px',
                height:          '6px',
                borderRadius:    '50%',
                background:      'var(--hab-amarillo)',
                display:         'inline-block',
                flexShrink:      0,
              }} />
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Right — decorative */}
      <div style={{position:'relative', overflow:'hidden'}}>
        {/* Arch decorations — same as HAB model doc */}
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:'270px', height:'370px',
          border:'1.5px solid rgba(255,255,255,0.1)',
          borderRadius:'170px 170px 0 0',
        }} />
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:'170px', height:'250px',
          border:'1.5px solid rgba(201,184,76,0.22)',
          borderRadius:'120px 120px 0 0',
        }} />
      </div>
    </section>
  )
}

function ProblemaSection() {
  const problems = [
    {
      icon: '🏦',
      title: 'El banco rechaza el 40% de los créditos',
      text: 'Los compradores de tu casa pueden estar interesados pero el banco les dice que no.',
    },
    {
      icon: '📅',
      title: 'Las casas tardan hasta 14 meses en venderse',
      text: 'Las casas de más de 20 años tienen muy poca demanda en el mercado tradicional.',
    },
    {
      icon: '📋',
      title: 'Los portales cobran pero no garantizan',
      text: 'Pagas publicidad mensual, recibes visitas, pero el proceso no avanza.',
    },
  ]

  return (
    <section style={{
      background: 'var(--hab-crema)',
      padding:    'var(--pad-v) var(--pad-h)',
    }}>
      <div className="section-label">El Problema</div>
      <h2 style={{
        fontFamily:    'var(--font-display)',
        fontWeight:    900,
        fontSize:      'clamp(32px,5vw,58px)',
        textTransform: 'uppercase',
        color:         'var(--hab-gris)',
        marginBottom:  '48px',
        lineHeight:    0.95,
      }}>
        ¿Por qué es tan<br />difícil vender?
      </h2>

      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap:                 '20px',
      }}>
        {problems.map((p) => (
          <div key={p.title} style={{
            background:   'var(--hab-blanco)',
            borderRadius: 'var(--radius-md)',
            padding:      '28px',
            borderLeft:   '4px solid var(--hab-verde-c)',
            transition:   'var(--transition-base)',
          }}>
            <div style={{fontSize:'28px', marginBottom:'14px'}}>{p.icon}</div>
            <h3 style={{
              fontFamily:    'var(--font-body)',
              fontSize:      '13px',
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color:         'var(--hab-gris)',
              marginBottom:  '8px',
            }}>
              {p.title}
            </h3>
            <p style={{
              fontSize:   '13px',
              fontWeight: 300,
              lineHeight: 1.7,
              color:      '#666',
            }}>
              {p.text}
            </p>
          </div>
        ))}
      </div>

      <p style={{
        textAlign:   'center',
        marginTop:   '40px',
        fontSize:    '15px',
        fontWeight:  400,
        color:       'var(--hab-verde)',
        fontStyle:   'italic',
      }}>
        Hay una forma diferente. Una que no depende de bancos ni portales.
      </p>
    </section>
  )
}

function ComoFuncionaSection() {
  const steps = [
    { n:'01', emoji:'📋', title:'Publica tu inmueble', text:'Foto, barrio y área. Sin costo. En 5 minutos.' },
    { n:'02', emoji:'📊', title:'HAB analiza el potencial', text:'Equipo y tecnología evalúan en 48 horas.' },
    { n:'03', emoji:'🤝', title:'Recibe una propuesta', text:'Una constructora hace una oferta formal garantizada.' },
    { n:'04', emoji:'✅', title:'Elige y firma', text:'HAB acompaña el proceso legal y protege tus intereses.' },
  ]

  return (
    <section style={{
      background: 'var(--hab-gris)',
      padding:    'var(--pad-v) var(--pad-h)',
    }}>
      <div style={{textAlign:'center', marginBottom:'56px'}}>
        <div style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          gap:           '9px',
          fontSize:      '9px',
          fontWeight:    600,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          color:         'var(--hab-amarillo)',
          marginBottom:  '16px',
        }}>
          <span style={{display:'block',width:'28px',height:'1.5px',background:'var(--hab-amarillo)'}}/>
          Así funciona
          <span style={{display:'block',width:'28px',height:'1.5px',background:'var(--hab-amarillo)'}}/>
        </div>
        <h2 style={{
          fontFamily:    'var(--font-display)',
          fontSize:      'clamp(32px,5vw,58px)',
          fontWeight:    900,
          textTransform: 'uppercase',
          color:         'var(--hab-blanco)',
        }}>
          4 pasos, sin banco, sin espera
        </h2>
      </div>

      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap:                 '20px',
        maxWidth:            '900px',
        margin:              '0 auto 48px',
      }}>
        {steps.map((s) => (
          <div key={s.n} style={{
            background:   'rgba(255,255,255,0.05)',
            border:       '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
            padding:      '28px 22px',
            textAlign:    'center',
          }}>
            <div style={{
              fontFamily:  'var(--font-display)',
              fontSize:    '40px',
              fontWeight:  900,
              color:       'rgba(201,184,76,0.2)',
              lineHeight:  1,
              marginBottom:'12px',
            }}>
              {s.n}
            </div>
            <div style={{fontSize:'28px', marginBottom:'12px'}}>{s.emoji}</div>
            <h3 style={{
              fontFamily:    'var(--font-body)',
              fontSize:      '11.5px',
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color:         'var(--hab-blanco)',
              marginBottom:  '8px',
            }}>
              {s.title}
            </h3>
            <p style={{
              fontSize:   '11px',
              fontWeight: 300,
              lineHeight: 1.65,
              color:      'rgba(255,255,255,0.5)',
            }}>
              {s.text}
            </p>
          </div>
        ))}
      </div>

      <div style={{textAlign:'center'}}>
        <a href="/registro/paso-1" className="btn-primary">
          Quiero publicar mi inmueble →
        </a>
      </div>
    </section>
  )
}

function ComparativaSection() {
  const rows = [
    ['Costo para el propietario', 'Comisión 3–5%', 'Publicidad mensual', '✓ Gratis'],
    ['Tiempo estimado de cierre', '12–18 meses', 'Sin garantía', '✓ 3–6 meses'],
    ['Necesita crédito bancario del comprador', 'Sí', 'Sí', '✓ No'],
    ['Garantías legales incluidas', 'No', 'No', '✓ Sí — HAB garantiza'],
    ['Asesoría experta dedicada', 'No', 'No', '✓ Sí'],
  ]

  return (
    <section style={{background:'var(--hab-crema)', padding:'var(--pad-v) var(--pad-h)'}}>
      <div className="section-label">Comparativa</div>
      <h2 style={{
        fontFamily:'var(--font-display)',fontWeight:900,
        fontSize:'clamp(28px,4vw,48px)',textTransform:'uppercase',
        color:'var(--hab-gris)',marginBottom:'40px',lineHeight:0.95,
      }}>
        ¿Por qué con HAB<br />y no con un portal?
      </h2>

      <div style={{overflowX:'auto'}}>
        <table style={{
          width:'100%',borderCollapse:'collapse',
          minWidth:'600px',
        }}>
          <thead>
            <tr>
              {['',
                'Venta tradicional',
                'Portal inmobiliario',
                'HAB'].map((h, i) => (
                <th key={i} style={{
                  padding:       '14px 16px',
                  textAlign:     i === 0 ? 'left' : 'center',
                  fontSize:      '10px',
                  fontWeight:    700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color:         i === 3 ? 'var(--hab-amarillo)' : '#aaa',
                  borderBottom:  '2px solid rgba(0,0,0,0.08)',
                  background:    i === 3 ? 'rgba(43,77,46,0.05)' : 'transparent',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{borderBottom:'1px solid rgba(0,0,0,0.05)'}}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding:    '12px 16px',
                    textAlign:  ci === 0 ? 'left' : 'center',
                    fontSize:   '13px',
                    fontWeight: ci === 3 ? 600 : ci === 0 ? 400 : 300,
                    color:      ci === 3 ? 'var(--hab-verde)' :
                                ci === 0 ? 'var(--hab-texto)' : '#888',
                    background: ci === 3 ? 'rgba(43,77,46,0.04)' : 'transparent',
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TestimoniosSection() {
  const testimonios = [
    {
      nombre: 'Carmen R.',
      barrio: 'Pasadena',
      texto:  'Llevaba 9 meses esperando comprador. HAB me ofreció un apartamento nuevo en 4 meses.',
    },
    {
      nombre: 'Jorge M.',
      barrio: 'Puente Largo',
      texto:  'No sabía que existía esta opción. Ahora tengo un apartamento moderno en el mismo barrio.',
    },
    {
      nombre: 'Ana P.',
      barrio: 'Chapinero',
      texto:  'El proceso fue claro y HAB me acompañó en cada paso. Muy profesional.',
    },
  ]

  return (
    <section style={{background:'var(--hab-verde)', padding:'var(--pad-v) var(--pad-h)'}}>
      <div style={{
        display:'flex',alignItems:'center',gap:'9px',
        fontSize:'9px',fontWeight:600,letterSpacing:'4px',
        textTransform:'uppercase',color:'var(--hab-amarillo)',
        marginBottom:'16px',
      }}>
        <span style={{display:'block',width:'28px',height:'1.5px',background:'var(--hab-amarillo)'}}/>
        Testimonios
      </div>
      <h2 style={{
        fontFamily:'var(--font-display)',fontWeight:900,
        fontSize:'clamp(28px,4vw,48px)',textTransform:'uppercase',
        color:'var(--hab-blanco)',marginBottom:'48px',lineHeight:0.95,
      }}>
        Propietarios que ya lo hicieron
      </h2>
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',
        gap:'20px',
      }}>
        {testimonios.map((t) => (
          <div key={t.nombre} style={{
            background:   'rgba(255,255,255,0.07)',
            border:       '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-md)',
            padding:      '28px',
          }}>
            <p style={{
              fontSize:    '14px',
              fontWeight:  300,
              lineHeight:  1.8,
              color:       'rgba(255,255,255,0.75)',
              fontStyle:   'italic',
              marginBottom:'20px',
            }}>
              "{t.texto}"
            </p>
            <div style={{
              fontSize:    '12px',
              fontWeight:  600,
              color:       'var(--hab-amarillo)',
              letterSpacing:'0.5px',
            }}>
              {t.nombre} · {t.barrio}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FaqSection() {
  const faqs = [
    {
      q: '¿Qué significa aportar mi casa a un proyecto?',
      a: 'En lugar de vender tu casa en el mercado tradicional, la "aportas" como terreno a un proyecto de construcción. A cambio recibes un apartamento nuevo o dinero equivalente, sin necesitar que un comprador consiga crédito bancario.',
    },
    {
      q: '¿Qué recibo a cambio de mi casa?',
      a: 'Puedes recibir un apartamento nuevo dentro del proyecto que se construya en tu lote, o una compensación económica acordada. HAB te presenta las opciones con todos los números claros antes de firmar.',
    },
    {
      q: '¿Quién garantiza que recibiré lo prometido?',
      a: 'HAB actúa como intermediario y garante. Los acuerdos se formalizan con promesas notariales, fideicomisos y cartas de crédito bancario. Nunca firmas algo sin respaldo legal.',
    },
    {
      q: '¿Hay algún costo para el propietario?',
      a: 'No. El servicio de HAB es completamente gratuito para el propietario. HAB cobra sus honorarios a la constructora como parte del proyecto.',
    },
    {
      q: '¿En qué zonas de Bogotá opera HAB?',
      a: 'Principalmente en el norte y noroccidente de Bogotá: Suba (Pasadena, Puente Largo, Alhambra), Chapinero, Teusaquillo, Barrios Unidos y zonas aledañas. Estamos expandiéndonos constantemente.',
    },
    {
      q: '¿Cuánto tiempo tarda el proceso?',
      a: 'El análisis inicial tarda 24–48 horas. Si hay una constructora interesada, la negociación puede tomar entre 1 y 3 meses. El proceso completo hasta recibir tu apartamento nuevo puede tardar entre 2 y 4 años (tiempo de construcción incluido).',
    },
  ]

  return (
    <section style={{background:'var(--hab-crema)', padding:'var(--pad-v) var(--pad-h)'}}>
      <div className="section-label">Preguntas frecuentes</div>
      <h2 style={{
        fontFamily:'var(--font-display)',fontWeight:900,
        fontSize:'clamp(28px,4vw,48px)',textTransform:'uppercase',
        color:'var(--hab-gris)',marginBottom:'40px',lineHeight:0.95,
      }}>
        Todo lo que necesitas saber
      </h2>
      <div style={{maxWidth:'720px'}}>
        {faqs.map((faq) => (
          <details key={faq.q} style={{
            borderBottom:'1px solid rgba(0,0,0,0.08)',
            paddingBottom:'16px',marginBottom:'16px',
          }}>
            <summary style={{
              fontFamily:  'var(--font-body)',
              fontSize:    '14px',
              fontWeight:  600,
              color:       'var(--hab-gris)',
              cursor:      'pointer',
              padding:     '12px 0',
              listStyle:   'none',
              display:     'flex',
              justifyContent:'space-between',
              alignItems:  'center',
              gap:         '16px',
            }}>
              {faq.q}
              <span style={{color:'var(--hab-verde)',fontSize:'20px',flexShrink:0}}>+</span>
            </summary>
            <p style={{
              fontFamily:  'var(--font-body)',
              fontSize:    '13.5px',
              fontWeight:  300,
              lineHeight:  1.8,
              color:       '#666',
              paddingTop:  '8px',
            }}>
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

function CtaFinalSection() {
  return (
    <section style={{
      background:     'var(--hab-verde)',
      padding:        'var(--pad-v) var(--pad-h)',
      textAlign:      'center',
    }}>
      <h2 style={{
        fontFamily:    'var(--font-display)',
        fontSize:      'clamp(32px,5vw,58px)',
        fontWeight:    900,
        textTransform: 'uppercase',
        color:         'var(--hab-blanco)',
        marginBottom:  '16px',
        lineHeight:    0.95,
      }}>
        Su casa merece<br />
        una mejor <span style={{color:'var(--hab-amarillo)'}}>oferta</span>
      </h2>
      <p style={{
        fontSize:'15px',fontWeight:300,
        color:'rgba(255,255,255,0.65)',
        maxWidth:'400px',margin:'0 auto 36px',lineHeight:1.8,
      }}>
        Publique gratis. Sin compromiso. En 5 minutos.
      </p>
      <a href="/registro/paso-1" className="btn-primary" style={{
        fontSize:'14px',padding:'16px 36px',
      }}>
        Comenzar ahora →
      </a>
      <p style={{
        marginTop:'20px',fontSize:'11px',fontWeight:300,
        color:'rgba(255,255,255,0.4)',
      }}>
        Más de 200 propietarios ya publicaron su inmueble en HAB
      </p>
    </section>
  )
}
