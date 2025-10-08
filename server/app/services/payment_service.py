from sqlalchemy.orm import Session
from typing import Dict, Optional
from decimal import Decimal
from app.config import settings
import requests
import json


class PaymentService:
    """Payment processing service"""
    
    @staticmethod
    def create_payment_intent(
        amount: Decimal,
        currency: str = "PHP",
        payment_method: str = "gcash",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create payment intent"""
        
        # Use empty dict if metadata is None
        safe_metadata = metadata or {}
        
        if payment_method == "stripe":
            return PaymentService.create_stripe_payment(amount, currency, safe_metadata)
        elif payment_method == "gcash":
            return PaymentService.create_gcash_payment(amount, safe_metadata)
        elif payment_method == "paymaya":
            return PaymentService.create_paymaya_payment(amount, safe_metadata)
        else:
            raise ValueError(f"Unsupported payment method: {payment_method}")
    
    @staticmethod
    def create_stripe_payment(amount: Decimal, currency: str, metadata: Dict) -> Dict:
        """Create Stripe payment intent"""
        if not settings.STRIPE_SECRET_KEY:
            raise ValueError("Stripe is not configured")
        
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency.lower(),
                metadata=metadata
            )
            
            return {
                "provider": "stripe",
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": amount,
                "currency": currency
            }
        except Exception as e:
            raise ValueError(f"Stripe payment creation failed: {str(e)}")
    
    @staticmethod
    def create_gcash_payment(amount: Decimal, metadata: Dict) -> Dict:
        """Create GCash payment"""
        if not settings.GCASH_API_KEY:
            raise ValueError("GCash is not configured")
        
        # GCash API integration
        try:
            payload = {
                "amount": float(amount),
                "currency": "PHP",
                "description": metadata.get("description", "Payment"),
                "redirectUrl": {
                    "success": metadata.get("success_url", "/payment/success"),
                    "failure": metadata.get("failure_url", "/payment/failure"),
                    "cancel": metadata.get("cancel_url", "/payment/cancel")
                }
            }
            
            headers = {
                "Authorization": f"Basic {settings.GCASH_API_KEY}",
                "Content-Type": "application/json"
            }
            
            # This is a placeholder - actual GCash API endpoints may differ
            response = requests.post(
                f"{settings.GCASH_BASE_URL}/payments",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "provider": "gcash",
                    "payment_id": data.get("id"),
                    "checkout_url": data.get("checkoutUrl"),
                    "amount": amount,
                    "currency": "PHP"
                }
            else:
                raise ValueError(f"GCash payment failed: {response.text}")
                
        except requests.RequestException as e:
            raise ValueError(f"GCash payment creation failed: {str(e)}")
    
    @staticmethod
    def create_paymaya_payment(amount: Decimal, metadata: Dict) -> Dict:
        """Create PayMaya payment"""
        if not settings.PAYMAYA_PUBLIC_KEY:
            raise ValueError("PayMaya is not configured")
        
        try:
            payload = {
                "totalAmount": {
                    "value": float(amount),
                    "currency": "PHP"
                },
                "redirectUrl": {
                    "success": metadata.get("success_url", "/payment/success"),
                    "failure": metadata.get("failure_url", "/payment/failure"),
                    "cancel": metadata.get("cancel_url", "/payment/cancel")
                },
                "requestReferenceNumber": metadata.get("reference", "")
            }
            
            headers = {
                "Authorization": f"Basic {settings.PAYMAYA_SECRET_KEY}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{settings.PAYMAYA_BASE_URL}/checkout",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                return {
                    "provider": "paymaya",
                    "checkout_id": data.get("checkoutId"),
                    "redirect_url": data.get("redirectUrl"),
                    "amount": amount,
                    "currency": "PHP"
                }
            else:
                raise ValueError(f"PayMaya payment failed: {response.text}")
                
        except requests.RequestException as e:
            raise ValueError(f"PayMaya payment creation failed: {str(e)}")
    
    @staticmethod
    def verify_payment(
        payment_id: str,
        provider: str
    ) -> Dict:
        """Verify payment status"""
        
        if provider == "stripe":
            return PaymentService.verify_stripe_payment(payment_id)
        elif provider == "gcash":
            return PaymentService.verify_gcash_payment(payment_id)
        elif provider == "paymaya":
            return PaymentService.verify_paymaya_payment(payment_id)
        else:
            raise ValueError(f"Unsupported payment provider: {provider}")
    
    @staticmethod
    def verify_stripe_payment(payment_intent_id: str) -> Dict:
        """Verify Stripe payment"""
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                "status": intent.status,
                "amount": intent.amount / 100,
                "currency": intent.currency.upper(),
                "verified": intent.status == "succeeded"
            }
        except Exception as e:
            raise ValueError(f"Stripe verification failed: {str(e)}")
    
    @staticmethod
    def verify_gcash_payment(payment_id: str) -> Dict:
        """Verify GCash payment"""
        try:
            headers = {
                "Authorization": f"Basic {settings.GCASH_API_KEY}"
            }
            
            response = requests.get(
                f"{settings.GCASH_BASE_URL}/payments/{payment_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": data.get("status"),
                    "amount": data.get("amount"),
                    "currency": "PHP",
                    "verified": data.get("status") == "PAYMENT_SUCCESS"
                }
            else:
                raise ValueError(f"GCash verification failed: {response.text}")
                
        except requests.RequestException as e:
            raise ValueError(f"GCash verification failed: {str(e)}")
    
    @staticmethod
    def verify_paymaya_payment(checkout_id: str) -> Dict:
        """Verify PayMaya payment"""
        try:
            headers = {
                "Authorization": f"Basic {settings.PAYMAYA_SECRET_KEY}"
            }
            
            response = requests.get(
                f"{settings.PAYMAYA_BASE_URL}/checkout/{checkout_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": data.get("status"),
                    "amount": data.get("totalAmount", {}).get("value"),
                    "currency": "PHP",
                    "verified": data.get("status") == "PAYMENT_SUCCESS"
                }
            else:
                raise ValueError(f"PayMaya verification failed: {response.text}")
                
        except requests.RequestException as e:
            raise ValueError(f"PayMaya verification failed: {str(e)}")
    
    @staticmethod
    def handle_webhook(provider: str, payload: Dict, signature: str) -> Dict:
        """Handle payment webhook"""
        
        if provider == "stripe":
            return PaymentService.handle_stripe_webhook(payload, signature)
        elif provider == "gcash":
            return PaymentService.handle_gcash_webhook(payload)
        elif provider == "paymaya":
            return PaymentService.handle_paymaya_webhook(payload)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    @staticmethod
    def handle_stripe_webhook(payload: Dict, signature: str) -> Dict:
        """Handle Stripe webhook"""
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            
            event = stripe.Webhook.construct_event(
                payload, signature, settings.STRIPE_WEBHOOK_SECRET
            )
            
            return {
                "type": event.type,
                "data": event.data.object
            }
        except Exception as e:
            raise ValueError(f"Webhook validation failed: {str(e)}")
    
    @staticmethod
    def handle_gcash_webhook(payload: Dict) -> Dict:
        """Handle GCash webhook"""
        # Implement GCash webhook validation
        return {
            "type": payload.get("eventType"),
            "data": payload
        }
    
    @staticmethod
    def handle_paymaya_webhook(payload: Dict) -> Dict:
        """Handle PayMaya webhook"""
        # Implement PayMaya webhook validation
        return {
            "type": payload.get("status"),
            "data": payload
        }