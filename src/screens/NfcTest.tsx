import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    StyleSheet,
    Alert,
    Platform,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import Text from '../components/Text';
import Button from '../components/Button';
import { Colors } from '../theme';

NfcManager.start();

const NfcTest = () => {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [tagData, setTagData] = useState<any>(null);

    const scanTag = async () => {
        console.log('[NFC] Scan button pressed');

        setStatus('scanning');
        setTagData(null);

        try {
            console.log('[NFC] Requesting NDEF tech');
            await NfcManager.requestTechnology(
                NfcTech.Ndef,
                { alertMessage: 'Hold your phone near the NFC tag' }
            );

            console.log('[NFC] Waiting for tag...');
            const tag = await NfcManager.getTag();

            console.log('[NFC] Tag detected:', tag);

            let decodedText: string | null = null;

            if (tag?.ndefMessage?.length) {
                const record = tag.ndefMessage[0];
                const payload = Uint8Array.from(record.payload);
                decodedText = Ndef.text.decodePayload(payload);
            }

            setTagData({
                id: tag?.id ?? 'NO_ID',
                decodedText,
                raw: tag,
            });

            setStatus('success');
            Alert.alert('NFC Success', 'Tag read successfully');

        } catch (err: any) {
            console.warn('[NFC] Error:', err);
            setStatus('error');
            Alert.alert('NFC Error', err?.message ?? 'Scan failed');
        } finally {
            console.log('[NFC] Closing NFC session');
            await NfcManager.cancelTechnologyRequest().catch(() => { });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <Text variant="title" style={styles.title}>
                    NFC iOS Test
                </Text>

                <Text variant="subtitle" style={styles.subtitle}>
                    Status: {status.toUpperCase()}
                </Text>

                <Button
                    title={status === 'scanning' ? 'Scanning…' : 'Scan NFC Tag'}
                    onPress={scanTag}
                    style={styles.button}
                />

                {tagData && (
                    <View style={styles.resultBox}>
                        <Text>ID:</Text>
                        <Text selectable>{tagData.id}</Text>

                        <Text style={{ marginTop: 10 }}>Decoded NDEF:</Text>
                        <Text selectable>
                            {tagData.decodedText ?? 'None'}
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: Colors.modalBackground,
        padding: 20,
        borderRadius: 14,
    },
    title: {
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        marginBottom: 20,
    },
    resultBox: {
        marginTop: 20,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
    },
});

export default NfcTest;