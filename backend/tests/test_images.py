from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from services.images import MAX_IMAGE_SIZE_BYTES, validate_image_metadata, validate_image_size


def make_upload(filename: str, content_type: str) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(b"image"),
        headers=Headers({"content-type": content_type}),
    )


def test_validate_image_metadata_accepts_supported_image():
    file = make_upload("hardware.png", "image/png")

    assert validate_image_metadata(file) == ".png"


def test_validate_image_metadata_rejects_unsupported_extension():
    file = make_upload("hardware.txt", "image/png")

    with pytest.raises(HTTPException) as exc_info:
        validate_image_metadata(file)

    assert exc_info.value.status_code == 400


def test_validate_image_metadata_rejects_unsupported_content_type():
    file = make_upload("hardware.png", "text/plain")

    with pytest.raises(HTTPException) as exc_info:
        validate_image_metadata(file)

    assert exc_info.value.status_code == 400


def test_validate_image_size_rejects_oversized_file():
    with pytest.raises(HTTPException) as exc_info:
        validate_image_size("hardware.png", b"x" * (MAX_IMAGE_SIZE_BYTES + 1))

    assert exc_info.value.status_code == 400
