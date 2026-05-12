import { useEffect, useState } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { save } from 'ionicons/icons';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { FlowCanvas } from '../features/builder/FlowCanvas';
import { getFlow } from '../api/flowsService';
import { useFlowStore } from '../store/useFlowStore';
import { useBuilderStore } from '../store/useBuilderStore';
import { useFlowBuilder } from '../features/builder/hooks/useFlowBuilder';
import { flowToNodes } from '../features/builder/utils/flowTransform';

interface MatchParams {
  id?: string;
}

export const FlowEdit: React.FC<RouteComponentProps<MatchParams>> = ({ match }) => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const [loading, setLoading] = useState(false);
  const id = match.params.id;
  const isNew = !id || id === 'new';

  const flowStore = useFlowStore();
  const builderStore = useBuilderStore();
  const builder = useFlowBuilder();

  useEffect(() => {
    flowStore.reset();
    builderStore.reset();
    if (isNew) {
      flowStore.setMetadata({ id: '', name: '', description: '', businessType: '', isActive: true });
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const flow = await getFlow(id!);
        flowStore.setMetadata({
          id: flow.id,
          name: flow.name,
          description: flow.description,
          businessType: flow.businessType,
          isActive: flow.isActive,
        });
        const { nodes, edges } = flowToNodes(flow);
        flowStore.setNodes(nodes);
        flowStore.setEdges(edges);
      } catch (err: any) {
        presentToast({ message: err.response?.data?.error ?? 'Load failed', duration: 2000, color: 'danger' });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    const result = await builder.saveFlow();
    if (result.success) {
      presentToast({ message: 'Saved', duration: 1500, color: 'success' });
      if (isNew && result.id) {
        history.replace(`/flows/${result.id}`);
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/flows" />
          </IonButtons>
          <IonTitle>{isNew ? 'New Flow' : flowStore.metadata.name || 'Edit Flow'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>
              <IonIcon slot="start" icon={save} />
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <IonSpinner name="dots" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8 }}>
              <IonItem>
                <IonLabel position="stacked">Name</IonLabel>
                <IonInput
                  value={flowStore.metadata.name}
                  onIonInput={(e) => flowStore.patchMetadata({ name: e.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Business type</IonLabel>
                <IonInput
                  value={flowStore.metadata.businessType}
                  onIonInput={(e) => flowStore.patchMetadata({ businessType: e.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonInput
                  value={flowStore.metadata.description}
                  onIonInput={(e) => flowStore.patchMetadata({ description: e.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonLabel>Active</IonLabel>
                <IonToggle
                  checked={flowStore.metadata.isActive}
                  onIonChange={(e) => flowStore.patchMetadata({ isActive: e.detail.checked })}
                />
              </IonItem>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <FlowCanvas />
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};
