import { useEffect, useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getLeadStats } from '../api/leadsService';
import { LeadStats } from '../types/lead';

export const Leads: React.FC = () => {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await getLeadStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefresh = async (e: CustomEvent) => {
    await load();
    (e.target as HTMLIonRefresherElement).complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Leads</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <IonSpinner name="dots" />
          </div>
        ) : error ? (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        ) : (
          <>
            <IonCard>
              <IonCardContent>
                <div style={{ color: 'var(--ion-color-medium)', fontSize: 13 }}>Total leads</div>
                <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1 }}>{stats?.total ?? 0}</div>
                <div style={{ color: 'var(--ion-color-medium)', fontSize: 12, marginTop: 4 }}>
                  Across all conversations to date
                </div>
              </IonCardContent>
            </IonCard>

            <h3 style={{ marginTop: 24, marginBottom: 8 }}>Monthly leads</h3>
            <IonCard>
              <IonCardContent>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={stats?.monthly ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ion-color-step-200)" />
                      <XAxis dataKey="month" stroke="var(--ion-color-medium)" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="var(--ion-color-medium)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--ion-card-background)',
                          border: '1px solid var(--ion-color-step-200)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" fill="var(--ion-color-primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </IonCardContent>
            </IonCard>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};
