import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/useAdminStore';
import {
    normalizeCondicaoCasasDecimais,
    readCondicaoCasasDecimais,
    type CondicaoCasasDecimais,
    useConfiguracoesStore,
} from '../../store/useConfiguracoesStore';
import { type ProdutoVitrine } from '../../store/useCartStore';
import { api } from '../../utils/api';
import { apiRoutes } from '../../utils/apiRoutes';
import { getImageUrl } from '../../utils/imageUtils';
import { formatCondicao, parseCondicao } from '../../utils/condicao';
import { appRoutes } from '../../utils/appRoutes';
import { brandPrimaryCssVar } from '../../constants/theme';
import { MissoesAdminPanel } from '../../components/admin/MissoesAdminPanel';
import { RoletaAdminPanel } from '../../components/admin/RoletaAdminPanel';
import {
    LogOut, Package, PackagePlus, ShoppingBag, Users,
    RefreshCcw, Search, CheckCircle, Clock, Plus, Trash2,
    UploadCloud, Phone, User as UserIcon, Calendar, ArrowRight,
    BarChart3, UserPlus, AlertTriangle, Sparkles, Pencil,
    ArrowUp, ArrowDown, Star, ImagePlus, Gift, Settings
} from 'lucide-react';

type AdminAction = 'BAIXA' | 'NOVO_ITEM' | 'PRODUTOS' | 'CRM' | 'TROCA' | 'ESTATISTICAS' | 'EQUIPE' | 'MISSOES' | 'ROLETA' | 'CONFIGURACOES' | null;
type FiltroTempo = 'HOJE' | 'SEMANA' | 'MES' | 'ANO' | 'PERSONALIZADO';

interface ItemVenda extends ProdutoVitrine {
    tempId: number;
    tamanhoSelecionado: string;
}

interface ItemDevolvido {
    id: number;
    nome: string;
    preco: number;
}

interface ProdutoAdmin {
    id: number | string;
    nome: string;
    precoVenda: number | string;
    precoAntigo?: number | string | null;
    precoCusto?: number | string | null;
    preco_custo?: number | string | null;
    condicao?: number | string | null;
    condicaoRoupa?: number | string | null;
    condicao_roupa?: number | string | null;
    tamanho: string;
    imagemUrl?: string | null;
    imagens?: ProdutoImagemApi[];
}

interface ProdutosPage {
    content?: ProdutoAdmin[];
}

interface ConfiguracoesAdminResponse {
    condicaoCasasDecimais?: number | string | null;
    condicao_casas_decimais?: number | string | null;
}

type ProdutoImagemApi = string | {
    id?: number | string | null;
    url?: string | null;
    imagemUrl?: string | null;
    caminho?: string | null;
    path?: string | null;
    principal?: boolean | number | string | null;
    ordem?: number | string | null;
};

interface ProdutoImageSource {
    id: string;
    imageId?: number | string | null;
    rawUrl: string;
    displayUrl: string;
    principal: boolean;
    ordem: number;
}

interface ProdutoEditPhoto {
    key: string;
    imageId?: number | string | null;
    rawUrl?: string;
    previewUrl: string;
    file?: File;
    isExisting: boolean;
    principal: boolean;
}

interface ProdutoCreateImage {
    file: File;
    previewUrl: string;
    key: string;
}

interface ProdutoEditState {
    id: ProdutoAdmin['id'];
    nome: string;
    precoVenda: string;
    precoAntigo: string;
    precoCusto: string;
    condicao: string;
    tamanho: string;
    fotos: ProdutoEditPhoto[];
}

const filtrosTempo: FiltroTempo[] = ['HOJE', 'SEMANA', 'MES', 'ANO', 'PERSONALIZADO'];
const uploadTimeoutMs = 60000;
const bytesPerMegabyte = 1024 * 1024;
const maxImageUploadBytes = 15 * bytesPerMegabyte;
const maxTotalUploadBytes = 80 * bytesPerMegabyte;
const productImageAccept = 'image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,.svg';
const acceptedProductImageMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
]);
const acceptedProductImageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

function isAcceptedProductImage(file: File) {
    const fileType = file.type.trim().toLowerCase();
    const fileName = file.name.trim().toLowerCase();

    return (
        acceptedProductImageMimeTypes.has(fileType)
        || acceptedProductImageExtensions.some((extension) => fileName.endsWith(extension))
    );
}

function getUploadFormatError(files: File[]) {
    if (files.some((file) => !isAcceptedProductImage(file))) {
        return 'Formato inválido. Envie JPG, PNG, WEBP ou SVG.';
    }

    return '';
}

function getUploadValidationError(files: File[]) {
    return getUploadFormatError(files) || getUploadSizeError(files);
}

function getUploadSizeError(files: File[]) {
    if (files.some((file) => file.size > maxImageUploadBytes)) {
        return 'Cada foto pode ter até 15 MB.';
    }

    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    if (totalBytes > maxTotalUploadBytes) {
        return 'O envio total pode ter até 80 MB.';
    }

    return '';
}

function parsePrice(value: number | string | null | undefined) {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    return Number(String(value).replace(',', '.')) || 0;
}

function formatPrice(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function formatPriceInput(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === '') return '';
    return String(value).replace(',', '.');
}

function getProdutoCondicao(produto: ProdutoAdmin) {
    return parseCondicao(produto.condicao ?? produto.condicaoRoupa ?? produto.condicao_roupa);
}

function getProdutoPrecoCusto(produto: ProdutoAdmin) {
    return parsePrice(produto.precoCusto ?? produto.preco_custo);
}

function formatAdminCondicao(produto: ProdutoAdmin) {
    const condicao = getProdutoCondicao(produto);
    return condicao === null ? '--' : formatCondicao(condicao, 2);
}

function formatAdminPrecoCusto(produto: ProdutoAdmin) {
    const precoCusto = getProdutoPrecoCusto(produto);
    return precoCusto > 0 ? formatPrice(precoCusto) : '--';
}

function isPrincipalImage(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
    return false;
}

function getProdutoImageSources(produto: ProdutoAdmin): ProdutoImageSource[] {
    const sources = (produto.imagens ?? [])
        .map((imagem, index): ProdutoImageSource | null => {
            if (typeof imagem === 'string') {
                if (!imagem.trim()) return null;

                return {
                    id: `${imagem}-${index}`,
                    imageId: null,
                    rawUrl: imagem,
                    displayUrl: getImageUrl(imagem),
                    principal: index === 0,
                    ordem: index,
                };
            }

            const rawUrl = imagem.url ?? imagem.imagemUrl ?? imagem.caminho ?? imagem.path ?? '';
            if (!rawUrl.trim()) return null;

            return {
                id: String(imagem.id ?? rawUrl),
                imageId: imagem.id ?? null,
                rawUrl,
                displayUrl: getImageUrl(rawUrl),
                principal: isPrincipalImage(imagem.principal),
                ordem: Number(imagem.ordem ?? index),
            };
        })
        .filter((imagem): imagem is ProdutoImageSource => Boolean(imagem));

    if (sources.length > 0) {
        return [...sources].sort((a, b) => a.ordem - b.ordem);
    }

    if (produto.imagemUrl) {
        return [{
            id: String(produto.imagemUrl),
            imageId: null,
            rawUrl: produto.imagemUrl,
            displayUrl: getImageUrl(produto.imagemUrl),
            principal: true,
            ordem: 0,
        }];
    }

    return [];
}

function getProdutoMainImage(produto: ProdutoAdmin) {
    const images = getProdutoImageSources(produto);
    return images.find((image) => image.principal)?.displayUrl
        ?? images[0]?.displayUrl
        ?? getImageUrl(null);
}

function mapProdutoAdminToVitrine(produto: ProdutoAdmin): ProdutoVitrine {
    const price = parsePrice(produto.precoVenda);
    const oldPrice = parsePrice(produto.precoAntigo);
    const images = getProdutoImageSources(produto);

    return {
        id: String(produto.id),
        name: produto.nome,
        price,
        category: 'Todas',
        iconId: 'shirt',
        sub: '',
        tamanho: produto.tamanho,
        curtidasCount: 0,
        passosCount: 0,
        images: images.length > 0 ? images.map((image) => image.displayUrl) : [getImageUrl(null)],
        secondaryImages: images.slice(1).map((image) => image.displayUrl),
        condicao: getProdutoCondicao(produto),
        priceNew: formatPrice(price),
        priceOld: oldPrice > 0 ? formatPrice(oldPrice) : undefined,
    };
}

function createProdutoEditState(produto: ProdutoAdmin): ProdutoEditState {
    return {
        id: produto.id,
        nome: produto.nome,
        precoVenda: formatPriceInput(produto.precoVenda),
        precoAntigo: formatPriceInput(produto.precoAntigo),
        precoCusto: formatPriceInput(produto.precoCusto ?? produto.preco_custo),
        condicao: formatPriceInput(getProdutoCondicao(produto)),
        tamanho: produto.tamanho,
        fotos: getProdutoImageSources(produto).map((image, index) => ({
            key: `existing-${image.id}-${index}`,
            imageId: image.imageId,
            rawUrl: image.rawUrl,
            previewUrl: image.displayUrl,
            isExisting: true,
            principal: image.principal,
        })),
    };
}

function getProdutoOrderValue(produto: ProdutoAdmin) {
    const numericId = Number(produto.id);
    return Number.isFinite(numericId) ? numericId : 0;
}

function getAdminProductRequestErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return 'Nao foi possivel concluir a operacao.';
    }

    if (!error.response) {
        return 'A API nao respondeu. Verifique se o backend esta no IP configurado e se o CORS libera esta origem, Authorization e PATCH/OPTIONS.';
    }

    if (error.response.status === 401 || error.response.status === 403) {
        return 'Sessao admin expirada ou sem permissao para esta acao.';
    }

    const data = error.response.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? 'Nao foi possivel concluir a operacao.';
}

export function AdminDashboardScreen() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAdminStore();
    const condicaoCasasDecimais = useConfiguracoesStore((state) => state.condicaoCasasDecimais);
    const setCondicaoCasasDecimais = useConfiguracoesStore((state) => state.setCondicaoCasasDecimais);
    const [activeAction, setActiveAction] = useState<AdminAction>(null);

    // --- ESTADOS: OPERAÇÕES DIÁRIAS ---
    const [buscaProduto, setBuscaProduto] = useState('');
    const [telefoneVenda, setTelefoneVenda] = useState('');
    const [nomeVenda, setNomeVenda] = useState('');
    const [statusVenda, setStatusVenda] = useState<'PAGO' | 'RESERVADO'>('PAGO');
    const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
    const [telefoneTroca, setTelefoneTroca] = useState('');
    const [itensDevolvidos, setItensDevolvidos] = useState<ItemDevolvido[]>([]);
    const nextItemId = useRef(1);
    const [nome, setNome] = useState('');
    const [precoVenda, setPrecoVenda] = useState('');
    const [precoAntigo, setPrecoAntigo] = useState('');
    const [precoCusto, setPrecoCusto] = useState('');
    const [condicao, setCondicao] = useState('');
    const [tamanho, setTamanho] = useState('');
    const [imagens, setImagens] = useState<ProdutoCreateImage[]>([]);
    const imagensRef = useRef<ProdutoCreateImage[]>([]);
    const [imagemPrincipalIndex, setImagemPrincipalIndex] = useState(0);
    const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
    const [isLoadingProdutos, setIsLoadingProdutos] = useState(true);
    const [isSavingProduto, setIsSavingProduto] = useState(false);
    const [isUpdatingProduto, setIsUpdatingProduto] = useState(false);
    const [buscaAdminProdutos, setBuscaAdminProdutos] = useState('');
    const [editingProduto, setEditingProduto] = useState<ProdutoEditState | null>(null);
    const [produtoError, setProdutoError] = useState('');
    const [produtoSuccess, setProdutoSuccess] = useState('');
    const [isLoadingConfiguracoes, setIsLoadingConfiguracoes] = useState(false);
    const [isSavingConfiguracoes, setIsSavingConfiguracoes] = useState(false);
    const [configuracoesError, setConfiguracoesError] = useState('');
    const [configuracoesSuccess, setConfiguracoesSuccess] = useState('');

    // --- ESTADOS: GERENCIAL ---
    const [filtroTempo, setFiltroTempo] = useState<FiltroTempo>('MES');
    const [novoVendedor, setNovoVendedor] = useState({ nome: '', email: '', senha: '' });

    const clientes: Array<{
        nome: string;
        tel: string;
        compras: number;
        total: number;
        ultima: string;
    }> = [];
    const equipe: Array<{
        id: number | string;
        nome: string;
        vendas: number;
        comissao: number;
    }> = [];

    const carregarProdutos = useCallback(async () => {
        setIsLoadingProdutos(true);
        setProdutoError('');

        try {
            const { data } = await api.get<ProdutoAdmin[] | ProdutosPage>(
                apiRoutes.admin.produtos.list,
            );
            setProdutos(Array.isArray(data) ? data : data.content ?? []);
        } catch {
            setProdutoError('Não foi possível carregar os produtos cadastrados.');
        } finally {
            setIsLoadingProdutos(false);
        }
    }, []);

    const carregarConfiguracoesAdmin = useCallback(async () => {
        setIsLoadingConfiguracoes(true);
        setConfiguracoesError('');

        try {
            const { data } = await api.get<ConfiguracoesAdminResponse>(
                apiRoutes.admin.configuracoes,
            );
            setCondicaoCasasDecimais(readCondicaoCasasDecimais(data));
        } catch {
            setConfiguracoesError('Não foi possível carregar as configurações da loja.');
        } finally {
            setIsLoadingConfiguracoes(false);
        }
    }, [setCondicaoCasasDecimais]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void carregarProdutos();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [carregarProdutos]);

    useEffect(() => {
        if (activeAction !== 'CONFIGURACOES' || currentUser?.role !== 'ADMIN') return;
        void carregarConfiguracoesAdmin();
    }, [activeAction, carregarConfiguracoesAdmin, currentUser?.role]);

    const salvarCondicaoCasasDecimais = async (casasDecimais: CondicaoCasasDecimais) => {
        setIsSavingConfiguracoes(true);
        setConfiguracoesError('');
        setConfiguracoesSuccess('');

        try {
            const { data } = await api.put<ConfiguracoesAdminResponse>(
                apiRoutes.admin.configuracoes,
                { condicaoCasasDecimais: casasDecimais },
            );
            setCondicaoCasasDecimais(
                data ? readCondicaoCasasDecimais(data) : casasDecimais,
            );
            setConfiguracoesSuccess('Configurações salvas com sucesso.');
        } catch {
            setConfiguracoesError('Não foi possível salvar as configurações agora.');
        } finally {
            setIsSavingConfiguracoes(false);
        }
    };

    useEffect(() => {
        imagensRef.current = imagens;
    }, [imagens]);

    useEffect(() => {
        return () => {
            imagensRef.current.forEach((imagemProduto) => {
                URL.revokeObjectURL(imagemProduto.previewUrl);
            });
        };
    }, []);

    const adicionarImagensProduto = (files: FileList | null) => {
        if (!files?.length) return;

        const selectedFiles = Array.from(files);
        const uploadFormatError = getUploadFormatError(selectedFiles);
        if (uploadFormatError) {
            setProdutoError(uploadFormatError);
            setProdutoSuccess('');
            return;
        }
        setProdutoError('');

        const novasImagens = selectedFiles.map((file, index): ProdutoCreateImage => ({
            file,
            previewUrl: URL.createObjectURL(file),
            key: `create-${Date.now()}-${index}-${file.name}`,
        }));

        setImagens((currentImages) => {
            if (currentImages.length === 0 && novasImagens.length > 0) {
                setImagemPrincipalIndex(0);
            }

            return [...currentImages, ...novasImagens];
        });
    };

    const removerImagemProduto = (imageKey: string) => {
        setImagens((currentImages) => {
            const removedIndex = currentImages.findIndex((imagemProduto) => imagemProduto.key === imageKey);
            if (removedIndex < 0) return currentImages;

            const removedImage = currentImages[removedIndex];
            URL.revokeObjectURL(removedImage.previewUrl);
            const nextImages = currentImages.filter((imagemProduto) => imagemProduto.key !== imageKey);

            setImagemPrincipalIndex((currentIndex) => {
                if (nextImages.length === 0) return 0;
                if (removedIndex === currentIndex) return 0;
                if (removedIndex < currentIndex) return Math.max(currentIndex - 1, 0);
                return Math.min(currentIndex, nextImages.length - 1);
            });

            return nextImages;
        });
    };

    const limparImagensProduto = () => {
        setImagens((currentImages) => {
            currentImages.forEach((imagemProduto) => {
                URL.revokeObjectURL(imagemProduto.previewUrl);
            });
            return [];
        });
        setImagemPrincipalIndex(0);
    };

    const cadastrarProduto = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (imagens.length === 0) {
            setProdutoError('Selecione ao menos uma foto para cadastrar o produto.');
            return;
        }

        const uploadValidationError = getUploadValidationError(imagens.map((imagemProduto) => imagemProduto.file));
        if (uploadValidationError) {
            setProdutoError(uploadValidationError);
            setProdutoSuccess('');
            return;
        }

        const formData = new FormData();
        formData.append('nome', nome.trim());
        formData.append('precoVenda', precoVenda);
        formData.append('precoAntigo', precoAntigo);
        formData.append('precoCusto', precoCusto);
        formData.append('condicao', condicao);
        formData.append('tamanho', tamanho.trim());
        const principalIndex = Math.min(Math.max(imagemPrincipalIndex, 0), imagens.length - 1);
        imagens.forEach((imagemProduto) => {
            formData.append('imagens', imagemProduto.file);
        });
        formData.append('imagemPrincipalIndex', String(principalIndex));

        setIsSavingProduto(true);
        setProdutoError('');
        setProdutoSuccess('');

        try {
            await api.post(apiRoutes.admin.produtos.create, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: uploadTimeoutMs,
            });

            setNome('');
            setPrecoVenda('');
            setPrecoAntigo('');
            setPrecoCusto('');
            setCondicao('');
            setTamanho('');
            limparImagensProduto();
            form.reset();
            setProdutoSuccess('Produto cadastrado com sucesso.');
            await carregarProdutos();
        } catch {
            setProdutoError('Não foi possível cadastrar o produto. Confira os dados e tente novamente.');
        } finally {
            setIsSavingProduto(false);
        }
    };

    const excluirProduto = async (produtoId: ProdutoAdmin['id']) => {
        setProdutoError('');
        setProdutoSuccess('');

        try {
            await api.delete(apiRoutes.admin.produtos.delete(produtoId));
            setProdutos((currentProducts) => (
                currentProducts.filter((produto) => produto.id !== produtoId)
            ));
            setProdutoSuccess('Produto removido com sucesso.');
        } catch {
            setProdutoError('Não foi possível excluir o produto.');
        }
    };

    const sincronizarProdutoAtualizado = (produtoAtualizado: ProdutoAdmin) => {
        setProdutos((currentProducts) => (
            currentProducts.map((produto) => (
                String(produto.id) === String(produtoAtualizado.id) ? produtoAtualizado : produto
            ))
        ));

        setEditingProduto((currentEditing) => {
            if (!currentEditing || String(currentEditing.id) !== String(produtoAtualizado.id)) {
                return currentEditing;
            }

            currentEditing.fotos.forEach((foto) => {
                if (!foto.isExisting) URL.revokeObjectURL(foto.previewUrl);
            });

            return createProdutoEditState(produtoAtualizado);
        });
    };

    const abrirEdicaoProduto = (produto: ProdutoAdmin) => {
        setProdutoError('');
        setProdutoSuccess('');
        setEditingProduto((currentEditing) => {
            currentEditing?.fotos.forEach((foto) => {
                if (!foto.isExisting) URL.revokeObjectURL(foto.previewUrl);
            });

            return createProdutoEditState(produto);
        });
    };

    const fecharEdicaoProduto = () => {
        setEditingProduto((currentEditing) => {
            currentEditing?.fotos.forEach((foto) => {
                if (!foto.isExisting) URL.revokeObjectURL(foto.previewUrl);
            });

            return null;
        });
    };

    const atualizarCampoEdicaoProduto = (
        campo: keyof Pick<ProdutoEditState, 'nome' | 'precoVenda' | 'precoAntigo' | 'precoCusto' | 'condicao' | 'tamanho'>,
        valor: string,
    ) => {
        setEditingProduto((currentEditing) => (
            currentEditing ? { ...currentEditing, [campo]: valor } : currentEditing
        ));
    };

    const adicionarFotosEdicaoProduto = (files: FileList | null) => {
        if (!files?.length) return;

        const selectedFiles = Array.from(files);
        const uploadFormatError = getUploadFormatError(selectedFiles);
        if (uploadFormatError) {
            setProdutoError(uploadFormatError);
            setProdutoSuccess('');
            return;
        }
        setProdutoError('');

        setEditingProduto((currentEditing) => {
            if (!currentEditing) return currentEditing;

            const hasPrincipalPhoto = currentEditing.fotos.some((foto) => foto.principal);
            const novasFotos = selectedFiles.map((file, index): ProdutoEditPhoto => ({
                key: `new-${Date.now()}-${index}-${file.name}`,
                file,
                previewUrl: URL.createObjectURL(file),
                isExisting: false,
                principal: !hasPrincipalPhoto && index === 0,
            }));

            return { ...currentEditing, fotos: [...currentEditing.fotos, ...novasFotos] };
        });
    };

    const removerFotoEdicaoProduto = (fotoKey: string) => {
        setEditingProduto((currentEditing) => {
            if (!currentEditing) return currentEditing;

            const fotoRemovida = currentEditing.fotos.find((foto) => foto.key === fotoKey);
            if (fotoRemovida && !fotoRemovida.isExisting) {
                URL.revokeObjectURL(fotoRemovida.previewUrl);
            }
            const nextFotos = currentEditing.fotos.filter((foto) => foto.key !== fotoKey);
            const shouldChooseNextPrincipal = Boolean(fotoRemovida?.principal) && nextFotos.length > 0;

            return {
                ...currentEditing,
                fotos: shouldChooseNextPrincipal
                    ? nextFotos.map((foto, index) => ({ ...foto, principal: index === 0 }))
                    : nextFotos,
            };
        });
    };

    const moverFotoEdicaoProduto = async (fotoKey: string, direction: -1 | 1) => {
        if (!editingProduto) return;

        const currentIndex = editingProduto.fotos.findIndex((foto) => foto.key === fotoKey);
        const nextIndex = currentIndex + direction;

        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= editingProduto.fotos.length) {
            return;
        }

        const nextFotos = [...editingProduto.fotos];
        const currentPhoto = nextFotos[currentIndex];
        nextFotos[currentIndex] = nextFotos[nextIndex];
        nextFotos[nextIndex] = currentPhoto;
        const nextEditingProduto = { ...editingProduto, fotos: nextFotos };

        setEditingProduto(nextEditingProduto);
        setProdutoError('');
        setProdutoSuccess('');

        if (nextFotos.some((foto) => !foto.isExisting)) {
            setProdutoSuccess('A ordem das fotos novas sera salva ao salvar alteracoes.');
            return;
        }

        const imagemIds = nextFotos
            .map((foto) => foto.imageId)
            .filter((imageId): imageId is number | string => imageId !== null && imageId !== undefined);

        if (imagemIds.length !== nextFotos.length) {
            setEditingProduto(editingProduto);
            setProdutoError('Nao foi possivel salvar a ordem porque uma imagem existente esta sem id.');
            return;
        }

        setIsUpdatingProduto(true);

        try {
            const { data } = await api.patch<ProdutoAdmin>(
                apiRoutes.admin.produtos.updateImageOrder(editingProduto.id),
                { imagemIds },
            );

            if (data?.id) {
                sincronizarProdutoAtualizado(data);
            } else {
                await carregarProdutos();
            }

            setProdutoSuccess('Ordem das fotos atualizada com sucesso.');
        } catch (moveImageError) {
            setEditingProduto(editingProduto);
            setProdutoError(getAdminProductRequestErrorMessage(moveImageError));
            await carregarProdutos();
        } finally {
            setIsUpdatingProduto(false);
        }
    };

    const marcarFotoPrincipalEdicaoProduto = async (fotoKey: string) => {
        if (!editingProduto) return;

        const selectedPhoto = editingProduto.fotos.find((foto) => foto.key === fotoKey);
        if (!selectedPhoto) return;

        if (!selectedPhoto.isExisting || !selectedPhoto.imageId) {
            setProdutoError('Salve a foto antes de defini-la como principal.');
            setProdutoSuccess('');
            return;
        }

        setIsUpdatingProduto(true);
        setProdutoError('');
        setProdutoSuccess('');

        try {
            const { data } = await api.patch<ProdutoAdmin>(
                apiRoutes.admin.produtos.setMainImage(editingProduto.id, selectedPhoto.imageId),
            );

            if (data?.id) {
                sincronizarProdutoAtualizado(data);
            } else {
                await carregarProdutos();
                fecharEdicaoProduto();
            }

            setProdutoSuccess('Foto principal atualizada com sucesso.');
        } catch (mainImageError) {
            setProdutoError(getAdminProductRequestErrorMessage(mainImageError));
        } finally {
            setIsUpdatingProduto(false);
        }
    };

    const salvarEdicaoProduto = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingProduto) return;

        const formData = new FormData();
        const fotosExistentes = editingProduto.fotos
            .filter((foto) => foto.isExisting && foto.rawUrl)
            .map((foto) => ({
                url: foto.rawUrl,
                principal: foto.principal,
                ordem: editingProduto.fotos.findIndex((currentPhoto) => currentPhoto.key === foto.key),
            }));
        const ordemFotos = editingProduto.fotos.map((foto, index) => ({
            tipo: foto.isExisting ? 'EXISTENTE' : 'NOVA',
            url: foto.rawUrl,
            nomeArquivo: foto.file?.name,
            principal: foto.principal,
            ordem: index,
        }));
        const novasFotos = editingProduto.fotos.filter((foto) => !foto.isExisting && foto.file);
        const primeiraFotoNovaPrincipal = novasFotos.find((foto) => foto.principal)?.file;
        const arquivosUploadEdicao = novasFotos.flatMap((foto) => (
            foto.file ? [foto.file] : []
        ));
        const uploadValidationError = getUploadValidationError(arquivosUploadEdicao);
        if (uploadValidationError) {
            setProdutoError(uploadValidationError);
            setProdutoSuccess('');
            return;
        }

        formData.append('nome', editingProduto.nome.trim());
        formData.append('precoVenda', editingProduto.precoVenda);
        formData.append('precoAntigo', editingProduto.precoAntigo);
        formData.append('precoCusto', editingProduto.precoCusto);
        formData.append('condicao', editingProduto.condicao);
        formData.append('tamanho', editingProduto.tamanho.trim());
        formData.append('imagensExistentes', JSON.stringify(fotosExistentes));
        formData.append('ordemFotos', JSON.stringify(ordemFotos));
        formData.append('imagemPrincipal', fotosExistentes.find((foto) => foto.principal)?.url ?? '');
        formData.append('novaImagemPrincipal', primeiraFotoNovaPrincipal ? 'true' : 'false');

        if (primeiraFotoNovaPrincipal) {
            formData.append('imagem', primeiraFotoNovaPrincipal);
        }

        novasFotos.forEach((foto) => {
            if (foto.file) {
                formData.append('novasImagens', foto.file);
                formData.append('imagens', foto.file);
            }
        });

        setIsUpdatingProduto(true);
        setProdutoError('');
        setProdutoSuccess('');

        try {
            await api.put(apiRoutes.admin.produtos.update(editingProduto.id), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: uploadTimeoutMs,
            });

            setProdutoSuccess('Produto atualizado com sucesso.');
            fecharEdicaoProduto();
            await carregarProdutos();
        } catch {
            setProdutoError('Não foi possível atualizar o produto. Confira os dados e tente novamente.');
        } finally {
            setIsUpdatingProduto(false);
        }
    };

    // --- LÓGICA DA BAIXA ---
    const produtosFiltrados = useMemo(() => {
        if (!buscaProduto) return [];
        const normalizedSearch = buscaProduto.trim().toLowerCase();

        return produtos
            .filter((produto) => (
                produto.nome.toLowerCase().includes(normalizedSearch)
                || String(produto.id) === normalizedSearch
            ))
            .slice(0, 5)
            .map(mapProdutoAdminToVitrine);
    }, [buscaProduto, produtos]);

    const ultimosProdutosCadastrados = useMemo(() => {
        return [...produtos]
            .sort((a, b) => getProdutoOrderValue(b) - getProdutoOrderValue(a))
            .slice(0, 5);
    }, [produtos]);

    const produtosAdminFiltrados = useMemo(() => {
        const normalizedSearch = buscaAdminProdutos.trim().toLowerCase();
        if (!normalizedSearch) return produtos;

        return produtos.filter((produto) => (
            produto.nome.toLowerCase().includes(normalizedSearch)
            || String(produto.id).toLowerCase().includes(normalizedSearch)
        ));
    }, [buscaAdminProdutos, produtos]);

    // --- LÓGICA DA TROCA ---
    const carregarHistoricoTroca = () => {
        setProdutoError('O histórico de trocas ainda não está disponível na API.');
    };

    const adicionarAoCarrinho = (produto: ProdutoVitrine) => {
        const tempId = nextItemId.current;
        nextItemId.current += 1;
        setItensVenda([...itensVenda, { ...produto, tempId, tamanhoSelecionado: 'M' }]);
        setBuscaProduto('');
    };

    const totalVenda = itensVenda.reduce((acc, item) => acc + parseFloat(item.priceNew.replace('R$', '').replace('.', '').replace(',', '.')), 0);
    const totalTroca = itensDevolvidos.reduce((acc, item) => acc + item.preco, 0);

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#F8F9FA', zIndex: 3000, overflowY: 'auto', paddingBottom: '60px' }}>

            {/* Top Bar */}
            <div style={{ background: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EEE', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0 }}>Painel Admin</h2>
                    <span style={{ fontSize: '10px', color: 'var(--terra)', fontWeight: 800 }}>MODO: {currentUser?.role}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => navigate(appRoutes.root)} style={{ background: '#F5F5F5', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>LOJA</button>
                    <button onClick={logout} style={{ color: '#FF3B30', background: 'none', border: 'none', cursor: 'pointer' }}><LogOut size={20}/></button>
                </div>
            </div>

            {/* VISÃO GERENCIAL (Apenas ADMIN) */}
            {currentUser?.role === 'ADMIN' && (
                <div style={{ padding: '20px 20px 0' }}>
                    <h3 style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800, letterSpacing: '1px' }}>Visão Gerencial</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button onClick={() => setActiveAction('ESTATISTICAS')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'ESTATISTICAS' ? '#8A2BE2' : 'white', color: activeAction === 'ESTATISTICAS' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                            <BarChart3 size={24} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Relatórios</span>
                        </button>
                        <button onClick={() => setActiveAction('EQUIPE')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'EQUIPE' ? '#007AFF' : 'white', color: activeAction === 'EQUIPE' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                            <UserPlus size={24} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Equipe</span>
                        </button>
                        <button onClick={() => setActiveAction('MISSOES')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'MISSOES' ? brandPrimaryCssVar : 'white', color: activeAction === 'MISSOES' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                            <Sparkles size={24} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Missões</span>
                        </button>
                        <button onClick={() => setActiveAction('ROLETA')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'ROLETA' ? brandPrimaryCssVar : 'white', color: activeAction === 'ROLETA' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                            <Gift size={24} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Roleta</span>
                        </button>
                        <button onClick={() => setActiveAction('CONFIGURACOES')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'CONFIGURACOES' ? brandPrimaryCssVar : 'white', color: activeAction === 'CONFIGURACOES' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                            <Settings size={24} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Configurações</span>
                        </button>
                    </div>
                </div>
            )}

            {/* OPERAÇÕES DO DIA A DIA */}
            <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800, letterSpacing: '1px' }}>Operações Diárias</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button onClick={() => setActiveAction('BAIXA')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'BAIXA' ? 'var(--dark)' : 'white', color: activeAction === 'BAIXA' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                        <ShoppingBag size={24} color={activeAction === 'BAIXA' ? 'white' : 'var(--terra)'} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Dar Baixa</span>
                    </button>
                    <button onClick={() => setActiveAction('CRM')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'CRM' ? 'var(--dark)' : 'white', color: activeAction === 'CRM' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                        <Users size={24} color={activeAction === 'CRM' ? 'white' : '#2D6A4F'} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Clientes</span>
                    </button>
                    <button onClick={() => setActiveAction('TROCA')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'TROCA' ? 'var(--dark)' : 'white', color: activeAction === 'TROCA' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                        <RefreshCcw size={24} color={activeAction === 'TROCA' ? 'white' : '#F5A623'} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Trocas</span>
                    </button>
                    <button onClick={() => setActiveAction('NOVO_ITEM')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'NOVO_ITEM' ? 'var(--dark)' : 'white', color: activeAction === 'NOVO_ITEM' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                        <PackagePlus size={24} color={activeAction === 'NOVO_ITEM' ? 'white' : '#4A90E2'} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Novo Item</span>
                    </button>
                    <button onClick={() => setActiveAction('PRODUTOS')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'PRODUTOS' ? 'var(--dark)' : 'white', color: activeAction === 'PRODUTOS' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                        <Package size={24} color={activeAction === 'PRODUTOS' ? 'white' : brandPrimaryCssVar} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Produtos</span>
                    </button>
                </div>
            </div>

            {/* ========================================== */}
            {/* SEÇÃO ADMIN: ESTATÍSTICAS AVANÇADAS        */}
            {/* ========================================== */}
            {activeAction === 'ESTATISTICAS' && currentUser?.role === 'ADMIN' && (
                <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={20} color="#8A2BE2" /> Relatório Financeiro
                    </h3>

                    {/* Filtros de Tempo */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                        {filtrosTempo.map(t => (
                            <button key={t} onClick={() => setFiltroTempo(t)} style={{ padding: '8px 14px', borderRadius: '20px', border: `1px solid ${filtroTempo === t ? '#8A2BE2' : '#EEE'}`, background: filtroTempo === t ? '#8A2BE2' : 'white', color: filtroTempo === t ? 'white' : '#999', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* KPI Principal */}
                    <div style={{ background: '#F8F0FF', padding: '20px', borderRadius: '16px', marginTop: '10px', border: '1px solid #EEDFFF' }}>
                        <div style={{ fontSize: '12px', color: '#8A2BE2', fontWeight: 700, textTransform: 'uppercase' }}>Faturamento ({filtroTempo})</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--dark)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>--</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#666' }}>
                            <span>Dados financeiros aguardando API.</span>
                        </div>
                    </div>

                    {/* Alertas de Estoque e Swipes */}
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ padding: '16px', background: '#FFF5F5', borderRadius: '16px', border: '1px solid #FFE5E5', display: 'flex', gap: '12px' }}>
                            <AlertTriangle size={20} color="#FF3B30" />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FF3B30' }}>Estoque Crítico</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Sem alertas reais carregados pela API.</div>
                            </div>
                        </div>

                        <div style={{ padding: '16px', background: '#F9F9F9', borderRadius: '16px', border: '1px solid #EEE' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dark)', marginBottom: '8px' }}>Métricas de Rejeição (App)</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Sem métricas reais carregadas pela API.</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO ADMIN: EQUIPE & VENDEDORES           */}
            {/* ========================================== */}
            {false && activeAction === 'EQUIPE' && currentUser?.role === 'ADMIN' && (
                <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={20} color="#007AFF" /> Gestão de Equipe
                    </h3>

                    {/* Lista de Vendedores e Ranking */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#999', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Ranking do Mês (Vendas)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {equipe.length === 0 && (
                                <div style={{ padding: '16px', borderRadius: '12px', background: '#F9F9F9', color: '#999', fontSize: '13px', textAlign: 'center' }}>
                                    Nenhum vendedor carregado pela API.
                                </div>
                            )}
                            {equipe.map((vendedor, index) => (
                                <div key={vendedor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9F9F9', padding: '12px 16px', borderRadius: '12px', border: '1px solid #EEE' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: index === 0 ? '#FFD700' : '#E0E0E0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>{index + 1}</div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{vendedor.nome}</div>
                                            <div style={{ fontSize: '11px', color: '#007AFF' }}>Comissão (5%): R$ {vendedor.comissao.toFixed(2).replace('.', ',')}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--dark)' }}>
                                        R$ {vendedor.vendas.toFixed(2).replace('.', ',')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cadastrar Novo Vendedor */}
                    <div style={{ borderTop: '1px solid #EEE', paddingTop: '20px' }}>
                        <div style={{ fontSize: '12px', color: '#999', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Adicionar Vendedor</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input type="text" placeholder="Nome Completo" value={novoVendedor.nome} onChange={e => setNovoVendedor({...novoVendedor, nome: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none' }} />
                            <input type="email" placeholder="E-mail de Login" value={novoVendedor.email} onChange={e => setNovoVendedor({...novoVendedor, email: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none' }} />
                            <input type="password" placeholder="Senha provisória" value={novoVendedor.senha} onChange={e => setNovoVendedor({...novoVendedor, senha: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none' }} />
                            <button style={{ padding: '14px', borderRadius: '12px', border: 'none', background: '#007AFF', color: 'white', fontWeight: 700, marginTop: '4px', cursor: 'pointer' }}>Criar Acesso</button>
                        </div>
                    </div>
                </div>
            )}

            {activeAction === 'MISSOES' && currentUser?.role === 'ADMIN' && (
                <MissoesAdminPanel />
            )}

            {activeAction === 'ROLETA' && currentUser?.role === 'ADMIN' && (
                <RoletaAdminPanel />
            )}

            {activeAction === 'CONFIGURACOES' && currentUser?.role === 'ADMIN' && (
                <ConfiguracoesAdminPanel
                    condicaoCasasDecimais={condicaoCasasDecimais}
                    isLoading={isLoadingConfiguracoes}
                    isSaving={isSavingConfiguracoes}
                    error={configuracoesError}
                    success={configuracoesSuccess}
                    onChange={(casasDecimais) => void salvarCondicaoCasasDecimais(casasDecimais)}
                />
            )}

            {activeAction === 'EQUIPE' && currentUser?.role === 'ADMIN' && (
                <UnsupportedModulePanel
                    title="Gestão de Equipe"
                    description="Dados indisponíveis enquanto o módulo de equipe não está integrado à API."
                    icon={<UserPlus size={20} color="#007AFF" />}
                />
            )}

            {activeAction === 'BAIXA' && (
                <UnsupportedModulePanel
                    title="Baixa de Estoque"
                    description="Dados indisponíveis enquanto o módulo de vendas e baixa de estoque não está integrado à API."
                    icon={<ShoppingBag size={20} color="var(--terra)" />}
                />
            )}

            {activeAction === 'CRM' && (
                <UnsupportedModulePanel
                    title="Clientes"
                    description="Dados indisponíveis enquanto o CRM de clientes não está integrado à API."
                    icon={<Users size={20} color="#2D6A4F" />}
                />
            )}

            {activeAction === 'TROCA' && (
                <UnsupportedModulePanel
                    title="Trocas / Devoluções"
                    description="Dados indisponíveis enquanto o módulo de trocas e devoluções não está integrado à API."
                    icon={<RefreshCcw size={20} color="#F5A623" />}
                />
            )}

            {/* AS SEÇÕES EXISTENTES CONTINUAM AQUI (Ocultadas para o código focar no novo) */}
            {/* Pode colar as seções de BAIXA, CRM, TROCA e NOVO_ITEM do código anterior logo abaixo desta linha */}

            {false && activeAction === 'BAIXA' && (
                <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>1. Cliente</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                <Phone size={18} color="#CCC" />
                                <input type="tel" placeholder="WhatsApp (Identificador)" value={telefoneVenda} onChange={e => setTelefoneVenda(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                <UserIcon size={18} color="#CCC" />
                                <input type="text" placeholder="Nome da Cliente" value={nomeVenda} onChange={e => setNomeVenda(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>2. Adicionar Peças</label>
                        <div style={{ position: 'relative', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px', border: buscaProduto ? '1.5px solid var(--terra)' : '1.5px solid transparent' }}>
                                <Search size={18} color="#999" />
                                <input type="text" placeholder="Buscar por Nome ou ID..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>

                            {produtosFiltrados.length > 0 && (
                                <div style={{ position: 'absolute', top: '55px', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, border: '1px solid #EEE' }}>
                                    {produtosFiltrados.map(p => (
                                        <div key={p.id} onClick={() => adicionarAoCarrinho(p)} style={{ padding: '12px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                                            <span style={{ fontSize: '13px' }}><strong>#{p.id}</strong> {p.name}</span>
                                            <span style={{ color: 'var(--terra)', fontWeight: 700, fontSize: '13px' }}>{p.priceNew}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {itensVenda.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {itensVenda.map(item => (
                                    <div key={item.tempId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#FFF8FA', borderRadius: '12px', border: '1px solid #FFEBF2' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--terra)' }}>{item.priceNew} · Tam: M</div>
                                        </div>
                                        <button onClick={() => setItensVenda(itensVenda.filter(i => i.tempId !== item.tempId))} style={{ border: 'none', background: 'none', color: '#FF3B30', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                <span style={{ fontSize: '12px', color: '#999' }}>Total: </span>
                                <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>R$ {totalVenda.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => setStatusVenda('PAGO')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: statusVenda === 'PAGO' ? '#34C759' : '#EEE', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><CheckCircle size={18}/> Pago</button>
                        <button onClick={() => setStatusVenda('RESERVADO')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: statusVenda === 'RESERVADO' ? '#F5A623' : '#EEE', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Clock size={18}/> Reservar</button>
                    </div>

                    <button disabled={itensVenda.length === 0 || !telefoneVenda} style={{ width: '100%', marginTop: '12px', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--dark)', color: 'white', fontWeight: 700, cursor: (itensVenda.length === 0 || !telefoneVenda) ? 'not-allowed' : 'pointer', opacity: (itensVenda.length === 0 || !telefoneVenda) ? 0.3 : 1 }}>
                        Finalizar e Baixar Estoque
                    </button>
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO: BAIXA (VENDA)                       */}
            {/* ========================================== */}
            {false && activeAction === 'BAIXA' && (
                <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>1. Cliente</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                <Phone size={18} color="#CCC" />
                                <input type="tel" placeholder="WhatsApp (Identificador)" value={telefoneVenda} onChange={e => setTelefoneVenda(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                <UserIcon size={18} color="#CCC" />
                                <input type="text" placeholder="Nome da Cliente" value={nomeVenda} onChange={e => setNomeVenda(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>2. Adicionar Peças (Nome ou ID)</label>
                        <div style={{ position: 'relative', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px', border: buscaProduto ? '1.5px solid var(--terra)' : '1.5px solid transparent' }}>
                                <Search size={18} color="#999" />
                                <input type="text" placeholder="Pesquisar..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>

                            {produtosFiltrados.length > 0 && (
                                <div style={{ position: 'absolute', top: '55px', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, border: '1px solid #EEE' }}>
                                    {produtosFiltrados.map(p => (
                                        <div key={p.id} onClick={() => adicionarAoCarrinho(p)} style={{ padding: '12px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                                            <span style={{ fontSize: '13px' }}><strong>#{p.id}</strong> {p.name}</span>
                                            <span style={{ color: 'var(--terra)', fontWeight: 700, fontSize: '13px' }}>{p.priceNew}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {itensVenda.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>Itens Selecionados</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                {itensVenda.map(item => (
                                    <div key={item.tempId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#FFF8FA', borderRadius: '12px', border: '1px solid #FFEBF2' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--terra)' }}>{item.priceNew} · Tam: M</div>
                                        </div>
                                        <button onClick={() => setItensVenda(itensVenda.filter(i => i.tempId !== item.tempId))} style={{ border: 'none', background: 'none', color: '#FF3B30', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                <span style={{ fontSize: '12px', color: '#999' }}>Total: </span>
                                <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>R$ {totalVenda.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => setStatusVenda('PAGO')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: statusVenda === 'PAGO' ? '#34C759' : '#EEE', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><CheckCircle size={18}/> Pago</button>
                        <button onClick={() => setStatusVenda('RESERVADO')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: statusVenda === 'RESERVADO' ? '#F5A623' : '#EEE', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Clock size={18}/> Reservar</button>
                    </div>

                    <button disabled={itensVenda.length === 0 || !telefoneVenda} style={{ width: '100%', marginTop: '12px', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--dark)', color: 'white', fontWeight: 700, cursor: (itensVenda.length === 0 || !telefoneVenda) ? 'not-allowed' : 'pointer', opacity: (itensVenda.length === 0 || !telefoneVenda) ? 0.3 : 1 }}>
                        Finalizar e Baixar Estoque
                    </button>
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO: CRM (PAINEL DE CLIENTES)            */}
            {/* ========================================== */}
            {false && activeAction === 'CRM' && (
                <div style={{ padding: '0 20px' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', margin: 0 }}>Fidelidade Clientes</h3>
                            <span style={{ fontSize: '11px', background: '#EEE', padding: '4px 8px', borderRadius: '8px' }}>{clientes.length} cadastradas</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {clientes.length === 0 && (
                                <div style={{ padding: '16px', borderRadius: '12px', background: '#F9F9F9', color: '#999', fontSize: '13px', textAlign: 'center' }}>
                                    Nenhum cliente carregado pela API.
                                </div>
                            )}
                            {clientes.map(c => (
                                <div key={c.tel} style={{ padding: '16px', border: '1px solid #F0F0F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700 }}>{c.nome}</div>
                                            <div style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {c.tel}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#34C759' }}>R$ {c.total.toFixed(2).replace('.', ',')}</div>
                                            <div style={{ fontSize: '10px', color: '#999' }}>Total Investido</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dotted #EEE' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ fontSize: '11px' }}><strong>{c.compras}</strong> Compras</div>
                                            <div style={{ fontSize: '11px', color: '#999' }}><Calendar size={10} style={{ verticalAlign: 'middle' }}/> {c.ultima}</div>
                                        </div>
                                        <button style={{ border: 'none', background: 'var(--soft)', color: 'var(--terra)', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>HISTÓRICO <ArrowRight size={10}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO: TROCA / DEVOLUÇÃO                   */}
            {/* ========================================== */}
            {false && activeAction === 'TROCA' && (
                <div style={{ margin: '0 20px', padding: '24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCcw size={20} color="#F5A623" /> Trocas / Devoluções
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Busca do Cliente pelo Histórico (Telefone) */}
                        <div style={{ background: '#F9F9F9', padding: '16px', borderRadius: '16px', border: '1px solid #EEE' }}>
                            <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Buscar Histórico</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                                <Search size={18} color="#999" />
                                <input type="tel" placeholder="Telefone do Cliente..." value={telefoneTroca} onChange={e => setTelefoneTroca(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '16px' }} />
                            </div>
                        </div>

                        {/* Peças sendo Devolvidas */}
                        <div style={{ border: '1px solid #EEE', borderRadius: '16px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Peças a Devolver</label>
                                <button onClick={carregarHistoricoTroca} style={{ background: '#FFF5E5', color: '#D08A1E', border: 'none', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <Plus size={14} /> Histórico
                                </button>
                            </div>

                            {itensDevolvidos.length === 0 ? (
                                <div style={{ fontSize: '13px', color: '#CCC', textAlign: 'center', padding: '20px 0' }}>Nenhuma peça selecionada para troca.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {itensDevolvidos.map((item) => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dark)' }}>{item.nome}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ fontSize: '14px', color: '#F5A623', fontWeight: 700 }}>R$ {item.preco.toFixed(2).replace('.', ',')}</div>
                                                <button onClick={() => setItensDevolvidos(itensDevolvidos.filter(i => i.id !== item.id))} style={{ border: 'none', background: 'none', color: '#FF3B30', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Motivo e Finalização */}
                        {itensDevolvidos.length > 0 && (
                            <div>
                                <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Motivo da Devolução</label>
                                <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none', marginTop: '6px', cursor: 'pointer' }}>
                                    <option>Tamanho não serviu</option>
                                    <option>Defeito na Peça</option>
                                    <option>Arrependimento</option>
                                </select>
                            </div>
                        )}

                        <button disabled={itensDevolvidos.length === 0 || !telefoneTroca} style={{ background: (itensDevolvidos.length > 0 && telefoneTroca) ? 'var(--dark)' : '#CCC', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: (itensDevolvidos.length > 0 && telefoneTroca) ? 'pointer' : 'not-allowed', marginTop: '10px' }}>
                            Gerar Crédito de R$ {totalTroca.toFixed(2).replace('.', ',')}
                        </button>
                    </div>
                </div>
            )}

            {activeAction === 'PRODUTOS' && (
                <div style={{ margin: '0 20px', padding: '24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
                        <h3 style={{ fontSize: '18px', color: 'var(--dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={20} color={brandPrimaryCssVar} /> Produtos
                        </h3>
                        <span style={{ fontSize: '11px', color: '#999', fontWeight: 700 }}>{produtos.length} itens</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '14px', border: '1px solid #EEE', marginBottom: '16px' }}>
                        <Search size={18} color="#999" />
                        <input
                            type="search"
                            placeholder="Buscar por nome ou ID"
                            value={buscaAdminProdutos}
                            onChange={(event) => setBuscaAdminProdutos(event.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }}
                        />
                    </div>

                    {produtoError && <div role="alert" style={{ padding: '11px 12px', borderRadius: '12px', color: '#A63D2F', background: '#FFF0ED', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>{produtoError}</div>}
                    {produtoSuccess && <div role="status" style={{ padding: '11px 12px', borderRadius: '12px', color: '#2D6A4F', background: '#EDF7F0', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>{produtoSuccess}</div>}

                    {isLoadingProdutos ? (
                        <div style={{ padding: '28px', textAlign: 'center', color: '#999', fontSize: '13px' }}>Carregando produtos...</div>
                    ) : produtosAdminFiltrados.length === 0 ? (
                        <div style={{ padding: '24px', borderRadius: '14px', background: '#F9F9F9', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                            Nenhum produto encontrado.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {produtosAdminFiltrados.map((produto) => (
                                <ProdutoAdminListItem
                                    key={produto.id}
                                    produto={produto}
                                    onEdit={() => abrirEdicaoProduto(produto)}
                                    onDelete={() => void excluirProduto(produto.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO: NOVO ITEM (CADASTRAR PRODUTO)       */}
            {/* ========================================== */}
            {activeAction === 'NOVO_ITEM' && (
                <div style={{ margin: '0 20px', padding: '24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PackagePlus size={20} color="#4A90E2" /> Cadastrar Peça
                    </h3>

                    <form onSubmit={cadastrarProduto} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <label style={{ minHeight: '120px', padding: '18px', borderRadius: '16px', border: '2px dashed #DDD', background: '#F9F9F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: imagens.length > 0 ? brandPrimaryCssVar : '#999', cursor: 'pointer', textAlign: 'center' }}>
                            <UploadCloud size={32} />
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>
                                {imagens.length > 0
                                    ? `${imagens.length} foto${imagens.length > 1 ? 's' : ''} selecionada${imagens.length > 1 ? 's' : ''}`
                                    : 'Selecionar fotos do produto'}
                            </span>
                            <span style={{ color: '#888', fontSize: '11px', fontWeight: 600 }}>
                                A primeira foto selecionada vira principal. Você pode trocar abaixo.
                            </span>
                            <input
                                type="file"
                                accept={productImageAccept}
                                multiple
                                onChange={(event) => {
                                    adicionarImagensProduto(event.target.files);
                                    event.target.value = '';
                                }}
                                style={{ width: '100%', fontSize: '12px' }}
                            />
                        </label>

                        {imagens.length > 0 && (
                            <div style={createImagesPreviewTrackStyle} aria-label="Fotos selecionadas">
                                {imagens.map((imagemProduto, index) => {
                                    const isPrincipal = index === imagemPrincipalIndex;

                                    return (
                                        <div
                                            key={imagemProduto.key}
                                            style={{
                                                ...createImagePreviewCardStyle,
                                                borderColor: isPrincipal ? brandPrimaryCssVar : '#E6E6E6',
                                                background: isPrincipal ? '#F4F7EF' : '#FFFFFF',
                                            }}
                                        >
                                            <AdminImagePreview
                                                src={imagemProduto.previewUrl}
                                                alt={`Foto selecionada ${index + 1}`}
                                                fileName={imagemProduto.file.name}
                                                style={createImagePreviewStyle}
                                            />

                                            <div style={createImagePreviewInfoStyle}>
                                                <span style={{
                                                    ...createImageBadgeStyle,
                                                    color: isPrincipal ? brandPrimaryCssVar : '#777',
                                                }}>
                                                    {isPrincipal ? 'Principal' : `Foto ${index + 1}`}
                                                </span>
                                                <div style={createImagePreviewActionsStyle}>
                                                    <button
                                                        type="button"
                                                        disabled={isPrincipal}
                                                        onClick={() => setImagemPrincipalIndex(index)}
                                                        style={{
                                                            ...photoActionButtonStyle,
                                                            minHeight: '26px',
                                                            opacity: isPrincipal ? 0.62 : 1,
                                                            cursor: isPrincipal ? 'default' : 'pointer',
                                                        }}
                                                    >
                                                        Principal
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removerImagemProduto(imagemProduto.key)}
                                                        style={{
                                                            ...photoIconButtonStyle,
                                                            color: '#FF3B30',
                                                            background: '#FFF1F0',
                                                        }}
                                                        aria-label={`Remover foto ${index + 1}`}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <input type="text" placeholder="Nome da peça" value={nome} onChange={(event) => setNome(event.target.value)} style={adminInputStyle} required />

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input type="number" min="0" step="0.01" placeholder="Preço de venda" value={precoVenda} onChange={(event) => setPrecoVenda(event.target.value)} style={{ ...adminInputStyle, flex: 1, minWidth: 0 }} required />
                            <input type="number" min="0" step="0.01" placeholder="Preço antigo" value={precoAntigo} onChange={(event) => setPrecoAntigo(event.target.value)} style={{ ...adminInputStyle, flex: 1, minWidth: 0 }} />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input type="number" min="0" max="10" step="0.01" placeholder="Condição da peça" value={condicao} onChange={(event) => setCondicao(event.target.value)} style={{ ...adminInputStyle, flex: 1, minWidth: 0 }} required />
                            <input type="number" min="0" step="0.01" placeholder="Preço de custo" value={precoCusto} onChange={(event) => setPrecoCusto(event.target.value)} style={{ ...adminInputStyle, flex: 1, minWidth: 0 }} />
                        </div>

                        <input type="text" placeholder="Tamanho (ex.: M ou P · M · G)" value={tamanho} onChange={(event) => setTamanho(event.target.value)} style={adminInputStyle} required />

                        {produtoError && <div role="alert" style={{ padding: '11px 12px', borderRadius: '12px', color: '#A63D2F', background: '#FFF0ED', fontSize: '12px', fontWeight: 600 }}>{produtoError}</div>}
                        {produtoSuccess && <div role="status" style={{ padding: '11px 12px', borderRadius: '12px', color: '#2D6A4F', background: '#EDF7F0', fontSize: '12px', fontWeight: 600 }}>{produtoSuccess}</div>}

                        <button type="submit" disabled={isSavingProduto} style={{ background: '#4A90E2', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: isSavingProduto ? 'wait' : 'pointer', opacity: isSavingProduto ? 0.65 : 1 }}>
                            {isSavingProduto ? 'Salvando produto...' : 'Salvar produto'}
                        </button>
                    </form>

                    <div style={{ marginTop: '28px', paddingTop: '22px', borderTop: '1px solid #EEE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--dark)' }}>Últimos itens cadastrados</h4>
                            <span style={{ fontSize: '11px', color: '#999' }}>{ultimosProdutosCadastrados.length} de {produtos.length}</span>
                        </div>

                        {isLoadingProdutos ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>Carregando produtos...</div>
                        ) : ultimosProdutosCadastrados.length === 0 ? (
                            <div style={{ padding: '24px', borderRadius: '14px', background: '#F9F9F9', textAlign: 'center', color: '#999', fontSize: '13px' }}>Nenhum produto cadastrado.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                                    <thead>
                                        <tr style={{ color: '#999', fontSize: '10px', textAlign: 'left', textTransform: 'uppercase' }}>
                                            <th style={adminTableHeaderStyle}>Foto</th>
                                            <th style={adminTableHeaderStyle}>Nome</th>
                                            <th style={adminTableHeaderStyle}>Tamanho</th>
                                            <th style={adminTableHeaderStyle}>Cond.</th>
                                            <th style={adminTableHeaderStyle}>Custo</th>
                                            <th style={{ ...adminTableHeaderStyle, textAlign: 'right' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ultimosProdutosCadastrados.map((produto) => {
                                            const imageUrl = getProdutoMainImage(produto);

                                            return (
                                                <tr key={produto.id} style={{ borderTop: '1px solid #F0F0F0' }}>
                                                    <td style={adminTableCellStyle}>
                                                        <img src={imageUrl} alt={produto.nome} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', background: '#EEE' }} />
                                                    </td>
                                                    <td style={{ ...adminTableCellStyle, fontSize: '13px', fontWeight: 700 }}>{produto.nome}</td>
                                                    <td style={{ ...adminTableCellStyle, fontSize: '12px', color: '#666' }}>{produto.tamanho}</td>
                                                    <td style={{ ...adminTableCellStyle, fontSize: '12px', color: '#666', fontWeight: 700 }}>{formatAdminCondicao(produto)}</td>
                                                    <td style={{ ...adminTableCellStyle, fontSize: '12px', color: '#666' }}>{formatAdminPrecoCusto(produto)}</td>
                                                    <td style={{ ...adminTableCellStyle, textAlign: 'right' }}>
                                                        <button type="button" aria-label={`Editar ${produto.nome}`} onClick={() => abrirEdicaoProduto(produto)} style={{ width: '36px', height: '36px', border: 0, borderRadius: '10px', color: '#4A90E2', background: '#EEF5FF', cursor: 'pointer', marginRight: '8px' }}>
                                                            <Pencil size={17} />
                                                        </button>
                                                        <button type="button" aria-label={`Excluir ${produto.nome}`} onClick={() => void excluirProduto(produto.id)} style={{ width: '36px', height: '36px', border: 0, borderRadius: '10px', color: '#FF3B30', background: '#FFF1F0', cursor: 'pointer' }}>
                                                            <Trash2 size={17} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {editingProduto && (
                <ProdutoEditModal
                    produto={editingProduto}
                    isSaving={isUpdatingProduto}
                    onClose={fecharEdicaoProduto}
                    onSubmit={salvarEdicaoProduto}
                    onFieldChange={atualizarCampoEdicaoProduto}
                    onAddPhotos={adicionarFotosEdicaoProduto}
                    onRemovePhoto={removerFotoEdicaoProduto}
                    onMovePhoto={moverFotoEdicaoProduto}
                    onSetMainPhoto={marcarFotoPrincipalEdicaoProduto}
                />
            )}
        </div>
    );
}

interface UnsupportedModulePanelProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

interface ConfiguracoesAdminPanelProps {
    condicaoCasasDecimais: CondicaoCasasDecimais;
    isLoading: boolean;
    isSaving: boolean;
    error: string;
    success: string;
    onChange: (casasDecimais: CondicaoCasasDecimais) => void;
}

function ConfiguracoesAdminPanel({
    condicaoCasasDecimais,
    isLoading,
    isSaving,
    error,
    success,
    onChange,
}: ConfiguracoesAdminPanelProps) {
    return (
        <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color={brandPrimaryCssVar} /> Configurações
            </h3>

            <section style={{ padding: '16px', borderRadius: '16px', background: '#F9F9F9', border: '1px solid #EEE' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    <strong style={{ color: 'var(--dark)', fontSize: '13px' }}>
                        Casas decimais da condição
                    </strong>
                    <span style={{ color: '#777', fontSize: '12px', lineHeight: 1.35 }}>
                        Define como a condição da peça aparece para os clientes.
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[1, 2].map((casasDecimais) => {
                        const value = normalizeCondicaoCasasDecimais(casasDecimais);
                        const isActive = condicaoCasasDecimais === value;

                        return (
                            <button
                                key={value}
                                type="button"
                                disabled={isLoading || isSaving}
                                onClick={() => onChange(value)}
                                style={{
                                    minHeight: '42px',
                                    border: 0,
                                    borderRadius: '12px',
                                    background: isActive ? brandPrimaryCssVar : '#FFFFFF',
                                    color: isActive ? '#FFFFFF' : '#333',
                                    cursor: isSaving ? 'wait' : 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    opacity: isLoading ? 0.62 : 1,
                                }}
                            >
                                Mostrar {value} casa{value === 1 ? '' : 's'}
                            </button>
                        );
                    })}
                </div>
            </section>

            {isLoading && <p style={configStatusStyle}>Carregando configurações...</p>}
            {isSaving && <p style={configStatusStyle}>Salvando configurações...</p>}
            {error && <p role="alert" style={configErrorStyle}>{error}</p>}
            {success && <p role="status" style={configSuccessStyle}>{success}</p>}
        </div>
    );
}

interface ProdutoAdminListItemProps {
    produto: ProdutoAdmin;
    onEdit: () => void;
    onDelete: () => void;
}

interface AdminImagePreviewProps {
    src: string;
    alt: string;
    fileName?: string;
    style: React.CSSProperties;
}

function AdminImagePreview({
    src,
    alt,
    fileName,
    style,
}: AdminImagePreviewProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <div
                aria-label={alt}
                role="img"
                style={{
                    ...style,
                    display: 'grid',
                    placeItems: 'center',
                    padding: '8px',
                    color: '#777',
                    fontSize: '10px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    textAlign: 'center',
                    wordBreak: 'break-word',
                }}
            >
                {fileName || 'Preview indisponível'}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            style={style}
            onError={() => setHasError(true)}
        />
    );
}

function ProdutoAdminListItem({
    produto,
    onEdit,
    onDelete,
}: ProdutoAdminListItemProps) {
    const price = parsePrice(produto.precoVenda);
    const oldPrice = parsePrice(produto.precoAntigo);

    return (
        <article style={{ display: 'grid', gridTemplateColumns: '76px minmax(0, 1fr)', gap: '12px', padding: '12px', borderRadius: '16px', border: '1px solid #EEE', background: '#FDFDFD' }}>
            <img
                src={getProdutoMainImage(produto)}
                alt={produto.nome}
                style={{ width: '76px', height: '92px', borderRadius: '12px', objectFit: 'cover', background: '#EEE' }}
            />
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                    <div style={{ fontSize: '10px', color: '#999', fontWeight: 800 }}>#{produto.id}</div>
                    <h4 style={{ margin: '2px 0 0', overflow: 'hidden', color: 'var(--dark)', fontSize: '14px', fontWeight: 800, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{produto.nome}</h4>
                    <div style={{ marginTop: '3px', color: '#666', fontSize: '11px', fontWeight: 700 }}>Tam. {produto.tamanho || 'Único'}</div>
                    <div style={{ marginTop: '3px', color: '#666', fontSize: '11px', fontWeight: 700 }}>Cond. {formatAdminCondicao(produto)}</div>
                    <div style={{ marginTop: '3px', color: '#999', fontSize: '11px', fontWeight: 700 }}>Custo {formatAdminPrecoCusto(produto)}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <strong style={{ color: brandPrimaryCssVar, fontSize: '14px' }}>{formatPrice(price)}</strong>
                    {oldPrice > 0 && (
                        <span style={{ color: '#999', fontSize: '11px', textDecoration: 'line-through' }}>{formatPrice(oldPrice)}</span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button type="button" onClick={onEdit} style={{ flex: 1, minHeight: '36px', border: 0, borderRadius: '10px', background: '#EEF5FF', color: '#4A90E2', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <Pencil size={14} /> Editar
                    </button>
                    <button type="button" onClick={onDelete} style={{ width: '42px', minHeight: '36px', border: 0, borderRadius: '10px', background: '#FFF1F0', color: '#FF3B30', cursor: 'pointer' }} aria-label={`Excluir ${produto.nome}`}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </article>
    );
}

interface ProdutoEditModalProps {
    produto: ProdutoEditState;
    isSaving: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onFieldChange: (
        campo: keyof Pick<ProdutoEditState, 'nome' | 'precoVenda' | 'precoAntigo' | 'precoCusto' | 'condicao' | 'tamanho'>,
        valor: string,
    ) => void;
    onAddPhotos: (files: FileList | null) => void;
    onRemovePhoto: (fotoKey: string) => void;
    onMovePhoto: (fotoKey: string, direction: -1 | 1) => void | Promise<void>;
    onSetMainPhoto: (fotoKey: string) => void | Promise<void>;
}

function ProdutoEditModal({
    produto,
    isSaving,
    onClose,
    onSubmit,
    onFieldChange,
    onAddPhotos,
    onRemovePhoto,
    onMovePhoto,
    onSetMainPhoto,
}: ProdutoEditModalProps) {
    return (
        <div role="dialog" aria-modal="true" aria-label="Editar produto" style={modalOverlayStyle}>
            <form onSubmit={onSubmit} style={productEditModalStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--dark)', fontSize: '18px' }}>Editar produto</h3>
                        <span style={{ color: '#999', fontSize: '11px', fontWeight: 800 }}>#{produto.id}</span>
                    </div>
                    <button type="button" onClick={onClose} style={{ width: '38px', height: '38px', border: 0, borderRadius: '12px', background: '#F4F4F4', color: '#333', cursor: 'pointer', fontWeight: 900 }}>
                        ×
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input value={produto.nome} onChange={(event) => onFieldChange('nome', event.target.value)} placeholder="Nome da peça" style={adminInputStyle} required />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input type="number" min="0" step="0.01" value={produto.precoVenda} onChange={(event) => onFieldChange('precoVenda', event.target.value)} placeholder="Preço venda" style={adminInputStyle} required />
                        <input type="number" min="0" step="0.01" value={produto.precoAntigo} onChange={(event) => onFieldChange('precoAntigo', event.target.value)} placeholder="Preço antigo" style={adminInputStyle} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input type="number" min="0" max="10" step="0.01" value={produto.condicao} onChange={(event) => onFieldChange('condicao', event.target.value)} placeholder="Condição" style={adminInputStyle} required />
                        <input type="number" min="0" step="0.01" value={produto.precoCusto} onChange={(event) => onFieldChange('precoCusto', event.target.value)} placeholder="Preço de custo" style={adminInputStyle} />
                    </div>

                    <input value={produto.tamanho} onChange={(event) => onFieldChange('tamanho', event.target.value)} placeholder="Tamanho" style={adminInputStyle} required />

                    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <strong style={{ color: 'var(--dark)', fontSize: '13px' }}>Fotos</strong>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '34px', padding: '0 12px', borderRadius: '10px', background: '#EDF7F0', color: brandPrimaryCssVar, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                                <ImagePlus size={15} />
                                Adicionar
                                <input
                                    type="file"
                                    accept={productImageAccept}
                                    multiple
                                    onChange={(event) => {
                                        onAddPhotos(event.target.files);
                                        event.target.value = '';
                                    }}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>

                        {produto.fotos.length === 0 ? (
                            <div style={{ padding: '16px', borderRadius: '14px', background: '#F9F9F9', color: '#999', fontSize: '12px', textAlign: 'center' }}>
                                Nenhuma foto vinculada. Adicione ao menos uma foto antes de salvar.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {produto.fotos.map((foto, index) => (
                                    <div key={foto.key} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', gap: '10px', alignItems: 'center', padding: '10px', borderRadius: '14px', background: foto.principal ? '#F4F7EF' : '#F9F9F9', border: `1px solid ${foto.principal ? '#CAD5BA' : '#EEE'}` }}>
                                        <AdminImagePreview
                                            src={foto.previewUrl}
                                            alt={`Foto ${index + 1}`}
                                            fileName={foto.file?.name ?? foto.rawUrl ?? `Foto ${index + 1}`}
                                            style={{ width: '64px', height: '74px', objectFit: 'cover', borderRadius: '10px', background: '#EEE' }}
                                        />
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: foto.principal ? brandPrimaryCssVar : '#777', fontSize: '11px', fontWeight: 800 }}>
                                                {foto.principal && <Star size={13} fill="currentColor" />}
                                                {foto.principal ? 'Foto principal' : `Foto ${index + 1}`}
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                <button
                                                    type="button"
                                                    disabled={foto.principal || isSaving}
                                                    onClick={() => void onSetMainPhoto(foto.key)}
                                                    style={photoActionButtonStyle}
                                                >
                                                    Definir como principal
                                                </button>
                                                <button type="button" disabled={index === 0 || isSaving} onClick={() => void onMovePhoto(foto.key, -1)} style={photoIconButtonStyle} aria-label="Subir foto"><ArrowUp size={13} /></button>
                                                <button type="button" disabled={index === produto.fotos.length - 1 || isSaving} onClick={() => void onMovePhoto(foto.key, 1)} style={photoIconButtonStyle} aria-label="Descer foto"><ArrowDown size={13} /></button>
                                                <button type="button" onClick={() => onRemovePhoto(foto.key)} style={{ ...photoIconButtonStyle, color: '#FF3B30', background: '#FFF1F0' }} aria-label="Remover foto"><Trash2 size={13} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <button type="submit" disabled={isSaving} style={{ width: '100%', minHeight: '48px', marginTop: '18px', border: 0, borderRadius: '16px', background: brandPrimaryCssVar, color: 'white', fontSize: '13px', fontWeight: 800, cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.66 : 1 }}>
                    {isSaving ? 'Salvando alterações...' : 'Salvar alterações'}
                </button>
            </form>
        </div>
    );
}

function UnsupportedModulePanel({
    title,
    description,
    icon,
}: UnsupportedModulePanelProps) {
    return (
        <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon}
                {title}
            </h3>
            <div style={{ padding: '18px', borderRadius: '16px', background: '#F9F9F9', color: '#777', fontSize: '13px', lineHeight: 1.5, textAlign: 'center' }}>
                {description}
            </div>
        </div>
    );
}

const adminInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #EEE',
    outline: 'none',
    background: '#F9F9F9',
    fontSize: '14px',
};

const adminTableHeaderStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontWeight: 700,
};

const adminTableCellStyle: React.CSSProperties = {
    padding: '10px',
    verticalAlign: 'middle',
};

const configStatusStyle: React.CSSProperties = {
    margin: '12px 0 0',
    color: '#777',
    fontSize: '12px',
    fontWeight: 700,
};

const configErrorStyle: React.CSSProperties = {
    margin: '12px 0 0',
    color: '#A63D2F',
    fontSize: '12px',
    fontWeight: 700,
};

const configSuccessStyle: React.CSSProperties = {
    margin: '12px 0 0',
    color: '#2D6A4F',
    fontSize: '12px',
    fontWeight: 700,
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 5000,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.36)',
    padding: '18px',
};

const productEditModalStyle: React.CSSProperties = {
    width: 'min(100%, 520px)',
    maxHeight: '92dvh',
    overflowY: 'auto',
    borderRadius: '24px 24px 18px 18px',
    background: 'white',
    padding: '22px',
    boxShadow: '0 24px 70px rgba(0, 0, 0, 0.24)',
};

const createImagesPreviewTrackStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '2px 0 4px',
    scrollbarWidth: 'thin',
};

const createImagePreviewCardStyle: React.CSSProperties = {
    display: 'grid',
    minWidth: '138px',
    maxWidth: '138px',
    gridTemplateRows: '104px auto',
    overflow: 'hidden',
    border: '1.5px solid #E6E6E6',
    borderRadius: '14px',
};

const createImagePreviewStyle: React.CSSProperties = {
    width: '100%',
    height: '104px',
    objectFit: 'cover',
    background: '#EEE',
};

const createImagePreviewInfoStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '72px',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '9px',
};

const createImageBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    minHeight: '16px',
    alignItems: 'center',
    fontSize: '10px',
    fontWeight: 900,
    lineHeight: 1,
};

const createImagePreviewActionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
};

const photoActionButtonStyle: React.CSSProperties = {
    minHeight: '28px',
    border: 0,
    borderRadius: '8px',
    background: '#FFFFFF',
    color: brandPrimaryCssVar,
    cursor: 'pointer',
    padding: '0 9px',
    fontSize: '10px',
    fontWeight: 800,
};

const photoIconButtonStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    border: 0,
    borderRadius: '8px',
    background: '#FFFFFF',
    color: '#333',
    cursor: 'pointer',
};

