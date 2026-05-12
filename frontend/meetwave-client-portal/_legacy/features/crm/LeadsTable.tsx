import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonText,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { Header } from '../../components/shared/Header';
import { getLeads, Lead } from '../../api/leadService';

export const LeadsTable: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLeads = async () => {
    try {
      setError('');
      const data = await getLeads();
      setLeads(data);
    } catch {
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleRefresh = async (e: CustomEvent) => {
    await loadLeads();
    (e.target as HTMLIonRefresherElement).complete();
  };

  return (
    <>
      <Header title="Leads" />
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        {loading ? (
          <IonList>
            {Array.from({ length: 5 }).map((_, i) => (
              <IonItem key={i}>
                <IonLabel>
                  <IonSkeletonText animated style={{ width: '100%' }} />
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : (
          <IonList>
            {leads.map((lead) => (
              <IonCard key={lead.id}>
                <IonCardHeader>
                  <IonCardTitle>{lead.user_phone}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>
                    <strong>Last Message:</strong> {lead.last_message}
                  </p>
                  {lead.current_flow_id && (
                    <p>
                      <strong>Flow:</strong> {lead.current_flow_id} (Step: {lead.current_step})
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                    {new Date(lead.timestamp).toLocaleString()}
                  </p>
                </IonCardContent>
              </IonCard>
            ))}
            {leads.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', marginTop: 40 }}>
                No leads yet.
              </p>
            )}
          </IonList>
        )}
      </IonContent>
    </>
  );
};
