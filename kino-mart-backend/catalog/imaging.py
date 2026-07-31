"""Resize and compress images before they're saved to storage.

Without this, whatever the admin uploads gets stored (and served) at its
original size — a phone photo saved as a "thumbnail" can easily be 3-5MB,
which is why product grids were loading megabytes of images per page.
"""
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps


def process_image_field(field_file, max_dimension, quality=82):
    """Resize `field_file` in place (before save) if it's a newly-uploaded file.

    Safe to call unconditionally in a model's save() — does nothing for
    fields that are unchanged/already stored (field_file._committed is True),
    so existing images aren't reprocessed on every unrelated save.
    """
    if not field_file or getattr(field_file, '_committed', True):
        return

    try:
        image = Image.open(field_file.file)
        image = ImageOps.exif_transpose(image)  # respect phone camera orientation
        if image.mode not in ('RGB', 'L'):
            image = image.convert('RGB')

        width, height = image.size
        if max(width, height) > max_dimension:
            ratio = max_dimension / float(max(width, height))
            image = image.resize(
                (max(1, int(width * ratio)), max(1, int(height * ratio))),
                Image.LANCZOS,
            )

        buffer = BytesIO()
        image.save(buffer, format='JPEG', quality=quality, optimize=True)
        buffer.seek(0)

        base_name = field_file.name.rsplit('.', 1)[0]
        field_file.save(f'{base_name}.jpg', ContentFile(buffer.read()), save=False)
    except Exception:
        # Not a processable image (corrupt file, unsupported format, etc.) —
        # fall back to storing the original rather than blocking the save.
        field_file.seek(0)
