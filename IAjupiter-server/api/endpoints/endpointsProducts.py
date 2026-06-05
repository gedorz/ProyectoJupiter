import logging

from fastapi import APIRouter, Depends, HTTPException, status

from DataBaseManagement.dbConectionPostgres import get_db_products
from DataBaseManagement.dbservicesProducts import ProductServicesManager
from DataBaseManagement.schemasProducts import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter()
logger = logging.getLogger("api.endpointsProducts")


@router.post("/products/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(product: ProductCreate, db=Depends(get_db_products)):
	logger.info("event=create_product_start name=%s", product.name_product)
	manager: ProductServicesManager = ProductServicesManager(db)
	created_product = manager.add_Product(product)
	logger.info("event=create_product_success product_id=%s", created_product.get("pk_product"))
	return created_product


@router.put("/products/{product_id}", response_model=ProductResponse, status_code=status.HTTP_202_ACCEPTED)
def actualizar_producto(product_id: int, product_update: ProductUpdate, db=Depends(get_db_products)):
	logger.info("event=update_product_start product_id=%s", product_id)
	manager: ProductServicesManager = ProductServicesManager(db)
	try:
		updated_product = manager.update_Product(product_id, product_update)
		logger.info("event=update_product_success product_id=%s", product_id)
		return updated_product
	except ValueError as e:
		logger.warning("event=update_product_not_found product_id=%s detail=%s", product_id, str(e))
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_producto(product_id: int, db=Depends(get_db_products)):
	logger.info("event=delete_product_start product_id=%s", product_id)
	manager: ProductServicesManager = ProductServicesManager(db)
	try:
		manager.delete_Product(product_id)
		logger.info("event=delete_product_success product_id=%s", product_id)
	except ValueError as e:
		logger.warning("event=delete_product_not_found product_id=%s detail=%s", product_id, str(e))
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
	return None


@router.put("/products/status/{product_id}", response_model=ProductResponse)
def set_product_status(product_id: int, db=Depends(get_db_products)):
	logger.info("event=set_product_status product_id=%s", product_id)
	manager: ProductServicesManager = ProductServicesManager(db)
	try:
		updated_product = manager.set_Product_status(product_id)
		logger.info("event=set_product_status_success product_id=%s", product_id)
		return updated_product
	except ValueError as e:
		logger.warning("event=set_product_status_not_found product_id=%s detail=%s", product_id, str(e))
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/products/", response_model=list[ProductResponse])
def listar_productos(db=Depends(get_db_products)):
	logger.info("event=list_products")
	manager: ProductServicesManager = ProductServicesManager(db)
	return manager.get_all_Products()


@router.get("/products/deshabilitados", response_model=list[ProductResponse])
def obtener_productos_deshabilitados(db=Depends(get_db_products)):
	logger.info("event=list_disabled_products")
	manager: ProductServicesManager = ProductServicesManager(db)
	return manager.get_disabled_Products()


@router.get("/products/deshabilitados/count")
def contar_deshabilitados(db=Depends(get_db_products)):
	logger.info("event=count_disabled_products")
	manager: ProductServicesManager = ProductServicesManager(db)
	return {"disabled": manager.count_disabled_Products()}


@router.get("/products/{product_id}", response_model=ProductResponse)
def obtener_producto(product_id: int, db=Depends(get_db_products)):
	logger.info("event=get_product_start product_id=%s", product_id)
	manager: ProductServicesManager = ProductServicesManager(db)
	try:
		product = manager.get_Product(product_id)
		logger.info("event=get_product_success product_id=%s", product_id)
		return product
	except ValueError as e:
		logger.warning("event=get_product_not_found product_id=%s detail=%s", product_id, str(e))
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
