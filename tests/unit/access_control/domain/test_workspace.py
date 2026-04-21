from __future__ import annotations

from uuid import uuid7

import pytest

from access_control.domain.workspace import Workspace


def test_workspace_con_owner_usuario():
    """Un workspace con owner_user_id debe crearse sin error."""
    ws = Workspace(
        id=uuid7(), name="Mi workspace",
        owner_user_id=uuid7(), owner_org_id=None, is_private=False,
    )
    assert ws.owner_user_id is not None


def test_workspace_con_owner_org():
    """Un workspace con owner_org_id debe crearse sin error."""
    ws = Workspace(
        id=uuid7(), name="Workspace org",
        owner_user_id=None, owner_org_id=uuid7(), is_private=False,
    )
    assert ws.owner_org_id is not None


def test_workspace_sin_owner_lanza_error():
    """Un workspace sin ningun owner debe lanzar ValueError."""
    with pytest.raises(ValueError):
        Workspace(
            id=uuid7(), name="Sin owner",
            owner_user_id=None, owner_org_id=None, is_private=False,
        )
