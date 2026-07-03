from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """
    Paginación estándar con count, next, previous, results.
    Soporta page_size dinámico por query param.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200
