import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonAlert,
  useIonAlert,
  IonFab,
  IonFabButton,
  IonIcon,
} from '@ionic/react';
import { addOutline, trash, save } from 'ionicons/icons';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes/nodeTypes';
import { useFlowBuilder } from './hooks/useFlowBuilder';

export const FlowCanvas: React.FC<{ onSave?: (flow: any) => void }> = ({ onSave }) => {
  const builder = useFlowBuilder();
  const [nodes, setNodes, onNodesChange] = useNodesState(builder.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(builder.edges);
  const [presentAlert] = useIonAlert();

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = addEdge(connection, edges);
      setEdges(edge);
      builder.handleConnect(connection);
    },
    [edges, setEdges, builder]
  );

  const handleAddNode = (type: string) => {
    builder.addNewNode(type);
  };

  const handleDeleteSelected = () => {
    if (!builder.selectedNodeId) return;
    presentAlert({
      header: 'Delete Node',
      message: 'Remove this step?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => builder.deleteNode(builder.selectedNodeId!),
        },
      ],
    });
  };

  const handleSave = async () => {
    const result = await builder.saveFlow();
    if (result.success && onSave) {
      onSave(result.flow);
    }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Flow Builder</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #ccc', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <IonSelect
              interfaceOptions={{ header: 'Add Node' }}
              placeholder="Add step"
              onIonChange={(e) => {
                if (e.detail.value) {
                  handleAddNode(e.detail.value);
                }
              }}
            >
              <IonSelectOption value="text">Text Input</IonSelectOption>
              <IonSelectOption value="list">List Menu</IonSelectOption>
              <IonSelectOption value="button">Button Choice</IonSelectOption>
              <IonSelectOption value="condition">Condition</IonSelectOption>
            </IonSelect>
            <IonButton
              fill="clear"
              color="danger"
              onClick={handleDeleteSelected}
              disabled={!builder.selectedNodeId}
            >
              <IonIcon slot="start" icon={trash} /> Delete
            </IonButton>
            <IonButton fill="solid" onClick={handleSave}>
              <IonIcon slot="start" icon={save} /> Save
            </IonButton>
          </div>

          {builder.error && (
            <div style={{ padding: '8px', backgroundColor: '#ffe0e0', color: '#d00', fontSize: '12px' }}>
              {builder.error}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>
      </IonContent>
    </>
  );
};
