import base64
import binascii
import json
import zlib


IMAGE_PAYLOAD_KIND = 'compressed-image'
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_ENCODED_LENGTH = 9 * 1024 * 1024


def pack_image_payload(image_value: str) -> str:
    if not image_value or not image_value.startswith('data:image/'):
        return image_value

    try:
        header, encoded = image_value.split(',', 1)
    except ValueError as exc:
        raise ValueError('Imagem invalida para publicacao') from exc

    mime = header.split(';', 1)[0].replace('data:', '').strip() or 'image/jpeg'
    if len(encoded) > MAX_ENCODED_LENGTH:
        raise ValueError('A imagem esta muito grande. Envie uma foto menor.')

    try:
        raw_bytes = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError('Nao foi possivel processar a imagem enviada') from exc

    if len(raw_bytes) > MAX_IMAGE_BYTES:
        raise ValueError('A imagem esta muito grande. Envie uma foto menor.')

    compressed = zlib.compress(raw_bytes, level=6)
    payload = {
        'kind': IMAGE_PAYLOAD_KIND,
        'mime': mime,
        'payload': base64.b64encode(compressed).decode('utf-8'),
    }
    return json.dumps(payload, separators=(',', ':'))


def is_compressed_image_payload(value: str | None) -> bool:
    if not value or not value.startswith('{'):
        return False
    try:
        payload = json.loads(value)
    except json.JSONDecodeError:
        return False
    return payload.get('kind') == IMAGE_PAYLOAD_KIND and bool(payload.get('payload'))
