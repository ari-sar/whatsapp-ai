import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  isPlatform,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { getLeads, type Lead } from '@/services/leadService';

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await getLeads();
      setLeads(data);
    } catch {
      setError('Failed to load leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async (e: CustomEvent) => {
    await load();
    (e.target as HTMLIonRefresherElement).complete();
  };

  const isDesktop = isPlatform('desktop') || isPlatform('tablet');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonMenuButton slot="start" />
          <IonTitle>Leads</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <IonItem key={i}>
              <IonLabel><IonSkeletonText animated style={{ width: '60%' }} /></IonLabel>
            </IonItem>
          ))
        ) : isDesktop ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--ion-color-light)' }}>
                <th style={{ padding: '8px 12px' }}>Phone</th>
                <th style={{ padding: '8px 12px' }}>Last Message</th>
                <th style={{ padding: '8px 12px' }}>Client ID</th>
                <th style={{ padding: '8px 12px' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--ion-color-light)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{lead.phone_number}</td>
                  <td style={{ padding: '8px 12px', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.last_message}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <IonBadge color="medium">{lead.client_id}</IonBadge>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--ion-color-medium)', fontSize: 13 }}>
                    {new Date(lead.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <IonList>
            {leads.map((lead) => (
              <IonCard key={lead.id}>
                <IonCardHeader>
                  <IonCardTitle>{lead.phone_number}</IonCardTitle>
                  <IonCardSubtitle>{new Date(lead.timestamp).toLocaleString()}</IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>{lead.last_message}</p>
                  <IonNote>{lead.client_id}</IonNote>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        {!loading && leads.length === 0 && !error && (
          <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', marginTop: 40 }}>
            No leads yet.
          </p>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Leads;
