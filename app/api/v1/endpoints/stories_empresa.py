from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.cache import cached, invalidate_prefix
from app.dependencies import get_db
from app.models.empresa import Empresa
from app.models.story_empresa import StoryEmpresa
from app.schemas.stories_empresa import StoryEmpresaCreate, StoryEmpresaRead, StoryFeedRead

router = APIRouter()


@router.post('/', response_model=StoryEmpresaRead)
def criar_story(data: StoryEmpresaCreate, db: Session = Depends(get_db)):
    story = StoryEmpresa(**data.model_dump())
    db.add(story)
    db.commit()
    db.refresh(story)
    invalidate_prefix('feed:stories')
    return story


@router.get('/', response_model=list[StoryFeedRead])
@cached('feed:stories', ttl=90)
def listar_stories(limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db)):
    rows = (
        db.query(StoryEmpresa, Empresa)
        .join(Empresa, Empresa.id == StoryEmpresa.id_empresa)
        .order_by(StoryEmpresa.criado_em.desc())
        .limit(limit)
        .all()
    )
    return [
        StoryFeedRead(
            id=story.id,
            id_empresa=story.id_empresa,
            imagem_url=story.imagem_url,
            criado_em=story.criado_em,
            empresa_nome=empresa.nome_empresa,
            categoria_empresa=empresa.categoria_empresa,
        )
        for story, empresa in rows
    ]
