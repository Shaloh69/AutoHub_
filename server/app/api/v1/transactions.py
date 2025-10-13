from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from datetime import datetime
from app.database import get_db
from app.schemas.transaction import (
    TransactionCreate, TransactionUpdate, TransactionResponse, TransactionDetailResponse
)
from app.schemas.common import MessageResponse, IDResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.car import Car

router = APIRouter()


@router.post("", response_model=IDResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new transaction"""
    # Get car
    car = db.query(Car).filter(Car.id == transaction_data.car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # FIX: Use getattr for car status
    car_status = str(getattr(car, 'status', ''))
    if car_status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Car is not available")
    
    # FIX: Use getattr for seller_id and price
    seller_id = int(getattr(car, 'seller_id', 0))
    car_price = getattr(car, 'price', 0)
    user_id = int(getattr(current_user, 'id', 0))
    
    # Create transaction
    transaction = Transaction(
        car_id=transaction_data.car_id,
        seller_id=seller_id,
        buyer_id=user_id,
        agreed_price=transaction_data.agreed_price,
        original_price=car_price,
        payment_method=transaction_data.payment_method,
        deposit_amount=transaction_data.deposit_amount,
        financing_provider=transaction_data.financing_provider,
        down_payment=transaction_data.down_payment,
        monthly_installment=transaction_data.monthly_installment,
        installment_months=transaction_data.installment_months,
        trade_in_accepted=transaction_data.trade_in_accepted,
        trade_in_value=transaction_data.trade_in_value,
        trade_in_vehicle_details=transaction_data.trade_in_vehicle_details
    )
    
    db.add(transaction)
    
    # Update car status - FIX: Use setattr
    setattr(car, 'status', 'reserved')
    
    db.commit()
    db.refresh(transaction)
    
    # FIX: Use getattr for transaction.id
    transaction_id = int(getattr(transaction, 'id', 0))
    return IDResponse(id=transaction_id, message="Transaction initiated successfully")


@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    role: str = "buyer",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user transactions"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    if role == "buyer":
        transactions = db.query(Transaction).filter(Transaction.buyer_id == user_id).all()
    else:
        transactions = db.query(Transaction).filter(Transaction.seller_id == user_id).all()
    
    return [TransactionResponse.model_validate(t) for t in transactions]


@router.get("/{transaction_id}", response_model=TransactionDetailResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction details"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        or_(
            Transaction.buyer_id == user_id,
            Transaction.seller_id == user_id
        )
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    
    return TransactionDetailResponse.model_validate(transaction)


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    update_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update transaction status"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    
    # Only seller or buyer can update - FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    seller_id = int(getattr(transaction, 'seller_id', 0))
    buyer_id = int(getattr(transaction, 'buyer_id', 0))
    
    if seller_id != user_id and buyer_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(transaction, key, value)
    
    # If completed, update car status
    if update_data.status == "completed":
        # FIX: Use getattr for car_id
        car_id = int(getattr(transaction, 'car_id', 0))
        car = db.query(Car).filter(Car.id == car_id).first()
        if car:
            setattr(car, 'status', 'sold')
    
    db.commit()
    db.refresh(transaction)
    
    return TransactionResponse.model_validate(transaction)