"use client";

import { History } from 'lucide-react';
import { Search} from 'lucide-react';
import Header from "@/components/header";
import BotaoChamado from '@/components/botaoChamado';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import api from '@/shared/axios';
import CreateChamadoDialog from '../Chamados/components/CreateChamadoDialog';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button';
import GetChamadoDialog from '../Chamados/components/GetChamadoDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, Filter } from "lucide-react";
import { ChamadoInterface, Status } from '@/shared/types';
import Rating from '@mui/material/Rating';
import HistoricoChamado from '@/components/HistoricoChamado';
import RefreshButton from '@/components/refreshButton/refreshButton';

interface ApiResponse {
  _embedded: {
      chamadoDTOList: ChamadoInterface[]
  }
  page: {
      totalElements: number
  }
}

const formatDate = (dateString: string): string => {
  try {
      const date = new Date(dateString)
      return date.toLocaleDateString("pt-BR")
  } catch (e) {
      return dateString
  }
}

const STATUS_MAP: Record<string, Status> = {
  "CONCLUÍDO": "CONCLUÍDO",
  "EM ANDAMENTO": "EM ANDAMENTO",
  PENDENTE: "PENDENTE",
}

const STATUS_COLORS: Record<Status, string> = {
  "CONCLUÍDO": "bg-green-500",
  "EM ANDAMENTO": "bg-blue-500",
  "PENDENTE": "bg-yellow-500",
}

const statusMapping = (apiStatus: string): Status => {
  return STATUS_MAP[apiStatus] || "PENDENTE"
}

export default function Dashboard() {

  const { user } = useContext(AuthContext)
  const [chamados, setChamados] = useState<ChamadoInterface[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Status[]>(["CONCLUÍDO", "EM ANDAMENTO", "PENDENTE"])
  const [novoChamadoDialogOpen, setNovoChamadoDialogOpen] = useState(false)
  const [selectedChamado, setSelectedChamado] = useState<ChamadoInterface | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogChamadoOpen, setDialogChamadoOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  const fetchChamados = useCallback(async () => {
      if (!user?.id) return

      try {
          setLoading(true)
          const response = await api.get<ApiResponse>(`/api/chamado/user/${user.id}`)
          if (response.data._embedded && response.data._embedded.chamadoDTOList) {
              setChamados(response.data._embedded.chamadoDTOList)
          } else {
              setChamados([])
          }
      } catch (err) {
          setError("Erro ao carregar chamados")
          console.error("Erro ao buscar chamados:", err)
      } finally {
          setLoading(false)
      }
  }, [user?.id])

  useEffect(() => {
      fetchChamados()
  }, [fetchChamados])

  const filteredChamados = chamados.filter((chamado) =>
    statusFilter.includes(statusMapping(chamado.status)) && chamado.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleStatusFilter = (status: Status) => {
    if (statusFilter.includes(status)) {
        setStatusFilter(statusFilter.filter((s) => s !== status))
    } else {
        setStatusFilter([...statusFilter, status])
    }
  }

  const visibleChamados = showAll ? filteredChamados : filteredChamados.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header/>
    
    {error?  (
     <div className="container py-8 max-w-7xl">
      <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-red-500">Erro: {error}</p>
      </div>
    </div>
    )
    :
      
    <>
      {/* Search Bar */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Pesquisar ocorrências..."
            className="w-full pl-10 font-lato pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-teal font-lato text-teal">
                      <Filter className="mr-2 font-lato h-4 w-4" /> Filtrar
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  {(Object.keys(STATUS_COLORS) as Status[]).map((status) => (
                      <DropdownMenuCheckboxItem
                          key={status}
                          checked={statusFilter.includes(status)}
                          onCheckedChange={() => toggleStatusFilter(status)}
                      >
                          <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]} mr-2`}></div>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                      </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {
        loading ? (
          <div className="container py-8 max-w-7xl">
                <div className="flex items-center justify-center min-h-[300px]">
                    <p>Carregando chamados...</p>
                </div>
            </div>
        ) : (
          <>

            {/* List Cards */}
            <h1 className='text-center text-2xl font-montserrat text-[--cor-primaria]'>SEUS CHAMADOS</h1>
            
            <div className="max-w-7xl mx-auto font-lato p-4 space-y-3">
            <div className='flex justify-between items-center mb-4'>
              <RefreshButton refresh={fetchChamados} className={chamados.length > 0 ? "visible" : "invisible"} />
              <BotaoChamado onClick={() => setNovoChamadoDialogOpen(true)}/>
            </div>
            {filteredChamados.length === 0 ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <p className="text-gray-500">Nenhum chamado encontrado.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {visibleChamados.map((chamado) => {
                      const status = statusMapping(chamado.status);
                      return (
                        <Card key={chamado.id} className="hover:shadow-md font-lato transition-shadow">
                          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-md font-medium">{chamado.titulo}</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm text-muted-foreground">
                                Criado em {formatDate(chamado.dataAbertura)}
                              </p>
                              <Badge className={`${STATUS_COLORS[status]} text-white`}>
                                {chamado.status.charAt(0).toUpperCase() + chamado.status.slice(1)}
                              </Badge>
                            </div>
                            {chamado.status === "CONCLUÍDO" && !chamado.avaliacao && (
                              <p className="text-sm text-[--cor-primaria2]">
                                Chamado concluído, deixe sua avaliação!
                              </p>
                            )}
                            {chamado.status === "CONCLUÍDO" && chamado.avaliacao && (
                              <>
                                <p>Avaliado com:</p>
                                <div className="flex flex-row">
                                  <Rating value={chamado.avaliacao.estrelas} readOnly />
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    {chamado.avaliacao.estrelas} Estrelas
                                  </span>
                                </div>
                              </>
                            )}
                            <div className='flex flex-row items-center mt-4 gap-2'>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full text-[--cor-primaria2] border-teal hover:bg-teal hover:text-[--cor-primaria]"
                                onClick={() => {
                                  setSelectedChamado(chamado)
                                  setDialogOpen(true)
                                }}
                              >
                                Abrir Chamado
                              </Button>
                              {chamado.historicos.length > 0 && (
                                <Button
                                  variant="outline"
                                  className='mt-2 text-[--cor-primaria2] border-teal hover:bg-teal hover:text-[--cor-primaria]'
                                  onClick={() => {
                                    setSelectedChamado(chamado)
                                    setDialogChamadoOpen(true)
                                  }}
                                >
                                  <History className="h-4 w-4 text-black" />
                                </Button>
                              )} 
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {filteredChamados.length > 3 && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center gap-2 bg-white border font-lato px-4 py-2 rounded shadow hover:shadow-md"
                      >
                        {showAll ? "Ver menos" : "Ver mais"}
                        <span className={`transition-transform ${showAll ? "rotate-180" : "rotate-0"}`}>
                          ▼
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}

            </div> 
          </>
        )
      }
      <GetChamadoDialog
        chamado={selectedChamado}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        atualizarChamado={() => { fetchChamados(); }}
      />

      <CreateChamadoDialog
        open={novoChamadoDialogOpen}
        onOpenChange={setNovoChamadoDialogOpen}
        onSuccess={async() => await fetchChamados()}
      />

      <HistoricoChamado
        dialogOpen={dialogChamadoOpen}
        setDialogOpen={setDialogChamadoOpen}
        selectedChamado={selectedChamado}
        isUser
      />

    </>
    }
      
    </div>
  );
}