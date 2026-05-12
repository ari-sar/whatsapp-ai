import { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { add, trash, create as createIcon } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { FlowSummary, deleteFlow, listFlows } from '../api/flowsService';

export const Flows: React.FC = () => {
  const history = useHistory();
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  const load = async () => {
    setLoading(true);
    try {
      setFlows(await listFlows());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = (flow: FlowSummary) => {
    presentAlert({
      header: 'Delete flow?',
      message: `Delete "${flow.name}"? This will remove the flow and all its steps. Active conversations using it will be cleared.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await deleteFlow(flow.id);
              presentToast({ message: 'Flow deleted', duration: 1500, color: 'success' });
              load();
            } catch (err: any) {
              presentToast({ message: err.response?.data?.error ?? 'Delete failed', duration: 2000, color: 'danger' });
            }
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Flows</IonTitle>
          <IonButton slot="end" onClick={() => history.push('/flows/new')}>
            <IonIcon slot="start" icon={add} />
            New
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <IonSpinner name="dots" />
          </div>
        ) : flows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ion-color-medium)' }}>
            <p>No flows yet.</p>
            <IonButton onClick={() => history.push('/flows/new')}>Create your first flow</IonButton>
          </div>
        ) : (
          <IonList>
            {flows.map((f) => (
              <IonItem key={f.id} button onClick={() => history.push(`/flows/${f.id}`)}>
                <IonLabel>
                  <h2>{f.name}</h2>
                  <IonNote>{f.businessType} · {f.stepCount} steps · {f.isActive ? 'active' : 'inactive'}</IonNote>
                  {f.description && <p style={{ fontSize: 12 }}>{f.description}</p>}
                </IonLabel>
                <IonButton
                  slot="end"
                  fill="clear"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    history.push(`/flows/${f.id}`);
                  }}
                >
                  <IonIcon icon={createIcon} />
                </IonButton>
                <IonButton
                  slot="end"
                  fill="clear"
                  color="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(f);
                  }}
                >
                  <IonIcon icon={trash} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};
