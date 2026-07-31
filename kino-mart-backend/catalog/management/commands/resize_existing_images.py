"""
One-time cleanup: resize images that were uploaded before automatic resizing
was added to the model save() methods. Safe to run multiple times — already
small images are skipped.

Usage:
    python manage.py resize_existing_images
    python manage.py resize_existing_images --dry-run
"""
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image, ImageOps

from catalog.models import Brand, Category, Product, ProductGalleryImage, ProductImage

# (model, field name, max_dimension, quality)
TARGETS = [
    (Category, 'image', 800, 85),
    (Brand, 'logo', 400, 85),
    (Product, 'thumbnail', 600, 80),
    (ProductImage, 'image', 1600, 85),
    (ProductGalleryImage, 'image', 1600, 85),
]


class Command(BaseCommand):
    help = 'Resize/compress existing images that predate the automatic resize-on-upload fix.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Report what would change without uploading anything.')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        total_before = 0
        total_after = 0
        changed = 0
        skipped = 0

        for model, field_name, max_dimension, quality in TARGETS:
            for obj in model.objects.all():
                field_file = getattr(obj, field_name)
                if not field_file:
                    continue
                try:
                    field_file.open('rb')
                    original_bytes = field_file.read()
                finally:
                    field_file.close()
                original_size = len(original_bytes)

                image = Image.open(BytesIO(original_bytes))
                image = ImageOps.exif_transpose(image)
                if image.mode not in ('RGB', 'L'):
                    image = image.convert('RGB')

                width, height = image.size
                needs_resize = max(width, height) > max_dimension
                # Re-encoding as optimized JPEG shrinks most phone/camera JPEGs
                # even when dimensions are already small, so always re-encode —
                # but skip re-uploading if it wouldn't actually save anything.
                if needs_resize:
                    ratio = max_dimension / float(max(width, height))
                    image = image.resize(
                        (max(1, int(width * ratio)), max(1, int(height * ratio))),
                        Image.LANCZOS,
                    )

                buffer = BytesIO()
                image.save(buffer, format='JPEG', quality=quality, optimize=True)
                new_size = buffer.tell()

                total_before += original_size
                if new_size >= original_size * 0.9:
                    # Not worth re-uploading for a <10% saving.
                    skipped += 1
                    total_after += original_size
                    continue

                changed += 1
                total_after += new_size
                label = f'{model.__name__}#{obj.pk}.{field_name}'
                self.stdout.write(f'{label}: {original_size:,}B -> {new_size:,}B ({field_file.name})')

                if not dry_run:
                    buffer.seek(0)
                    base_name = field_file.name.rsplit('.', 1)[0]
                    field_file.save(f'{base_name}.jpg', ContentFile(buffer.read()), save=True)

        verb = 'Would resize' if dry_run else 'Resized'
        self.stdout.write(self.style.SUCCESS(
            f'\n{verb} {changed} image(s), skipped {skipped} already-optimized. '
            f'Total: {total_before:,}B -> {total_after:,}B '
            f'({(1 - total_after / total_before) * 100:.0f}% smaller)' if total_before else 'No images found.'
        ))
