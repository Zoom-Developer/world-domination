from typing import Any, Dict
from typing_extensions import Annotated, Doc
from fastapi import HTTPException


class NotEnoughMoney(HTTPException):
    def __init__(self) -> None:
        super().__init__(403, "Недостаточно средств")

class NuclearAlreadySended(HTTPException):
    def __init__(self) -> None:
        super().__init__(403, "Вы уже отправили ракету на этот город")