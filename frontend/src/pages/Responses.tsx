import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonModal,
  IonPage,
  IonSkeletonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { addOutline, trashOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import {
  createResponse,
  deleteResponse,
  getResponses,
  type ResponseRecord,
} from '@/services/responseService';

const Responses: React.FC = () => {
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const modal = useRef<HTMLIonModalElement>(null);
  const [presentAlert] = useIonAlert();

  const load = async () => {
    try {
      const data = await getResponses();
      setResponses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!message.trim()) return;
    setSaving(true);
    try {
      await createResponse({ message: message.trim(), media_url: mediaUrl.trim() || undefined });
      setMessage('');
      setMediaUrl('');
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    presentAlert({
      header: 'Delete Response',
      message: 'Are you sure? This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await deleteResponse(id);
            await load();
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonMenuButton slot="start" />
          <IonTitle>Response Library</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <IonItem key={i}>
              <IonLabel><IonSkeletonText animated style={{ width: '80%' }} /></IonLabel>
            </IonItem>
          ))
        ) : (
          <IonList>
            {responses.map((r) => (
              <IonCard key={r.id}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <p style={{ margin: 0 }}>{r.message}</p>
                      {r.media_url && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ion-color-medium)' }}>
                          {r.media_url}
                        </p>
                      )}
                    </div>
                    <IonButton fill="clear" color="danger" onClick={() => handleDelete(r.id)}>
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
            {responses.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', marginTop: 40 }}>
                No responses yet. Add one below.
              </p>
            )}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setModalOpen(true)}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      <IonModal ref={modal} isOpen={modalOpen} onDidDismiss={() => setModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>New Response</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel position="stacked">Message *</IonLabel>
            <IonTextarea
              value={message}
              onIonInput={(e) => setMessage(e.detail.value ?? '')}
              rows={4}
              placeholder="Type the automated reply message..."
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Media URL (optional)</IonLabel>
            <IonInput
              value={mediaUrl}
              onIonInput={(e) => setMediaUrl(e.detail.value ?? '')}
              placeholder="https://..."
            />
          </IonItem>
          <IonButton
            expand="block"
            style={{ marginTop: 16 }}
            onClick={handleCreate}
            disabled={saving || !message.trim()}
          >
            {saving ? 'Saving...' : 'Save Response'}
          </IonButton>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Responses;
