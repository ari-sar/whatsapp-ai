import { useEffect, useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { gitBranch, chatbubbles, people, arrowForward } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { getLeadStats } from '../api/leadsService';
import { listKeywords } from '../api/keywordsService';
import { listFlows, getMyFlow } from '../api/flowsService';

interface HomeStats {
  leads: number;
  keywords: number;
  flowName: string;
}

export const Home: React.FC = () => {
  const history = useHistory();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [leadStats, keywords, flows, myFlowId] = await Promise.all([
          getLeadStats(),
          listKeywords(),
          listFlows(),
          getMyFlow(),
        ]);
        const flow = flows.find((f) => f.id === myFlowId);
        setStats({
          leads: leadStats.total,
          keywords: keywords.length,
          flowName: flow ? `${flow.businessType} — ${flow.name}` : 'No flow selected',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    {
      key: 'flow',
      title: 'My Flow',
      subtitle: stats?.flowName ?? '—',
      icon: gitBranch,
      onClick: () => history.push('/app/flow'),
      color: 'var(--ion-color-primary)',
    },
    {
      key: 'keywords',
      title: 'My Keywords',
      subtitle: stats ? `${stats.keywords} configured` : '—',
      icon: chatbubbles,
      onClick: () => history.push('/app/keywords'),
      color: 'var(--ion-color-secondary)',
    },
    {
      key: 'leads',
      title: 'Leads',
      subtitle: stats ? `${stats.leads} total` : '—',
      icon: people,
      onClick: () => history.push('/app/leads'),
      color: 'var(--ion-color-tertiary)',
    },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '4px 0' }}>Hi {user?.name?.split(' ')[0] ?? 'there'}</h2>
          {user?.businessName && (
            <IonText color="medium">
              <p style={{ margin: 0 }}>{user.businessName}</p>
            </IonText>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <IonSpinner name="dots" />
          </div>
        ) : (
          cards.map((c) => (
            <IonCard key={c.key} button onClick={c.onClick}>
              <IonCardContent>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: c.color,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IonIcon icon={c.icon} style={{ fontSize: 24 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ion-text-color)' }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--ion-color-medium)' }}>{c.subtitle}</div>
                  </div>
                  <IonIcon icon={arrowForward} color="medium" />
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};
