"""
Módulo de análisis genómico usando Biopython y NCBI Entrez
"""
from Bio import Entrez, SeqIO
from Bio.SeqUtils import gc_fraction
from Bio.Seq import Seq
import re
from typing import Dict, List, Tuple, Optional
import time


class GenomeAnalyzer:
    """Analiza genomas desde NCBI usando IDs de acceso"""
    
    def __init__(self, email: str, api_key: Optional[str] = None):
        """
        Inicializa el analizador
        
        Args:
            email: Email requerido por NCBI
            api_key: API key opcional de NCBI (aumenta rate limit)
        """
        Entrez.email = email
        if api_key:
            Entrez.api_key = api_key
    
    def fetch_genome(self, accession_id: str) -> Dict:
        """
        Obtiene información completa del genoma desde NCBI
        
        Args:
            accession_id: ID de acceso NCBI (ej: NC_000001.11)
            
        Returns:
            Diccionario con datos del genoma
        """
        try:
            # Respetar rate limits de NCBI (3 requests/segundo sin API key)
            time.sleep(0.34)
            
            # Obtener registro GenBank con partes (mejor para genomas grandes)
            handle = Entrez.efetch(
                db="nucleotide",
                id=accession_id,
                rettype="gbwithparts",  # Cambio clave: incluye features sin secuencia completa
                retmode="text"
            )
            record = SeqIO.read(handle, "genbank")
            handle.close()
            
            # Obtener longitud y secuencia
            sequence = ""
            length = len(record) if record.seq is not None else 0
            
            # Intentar obtener la secuencia si está disponible
            try:
                if length > 0 and length < 50000000:  # Solo si es < 50MB
                    temp_seq = str(record.seq)
                    if temp_seq and "Undefined" not in str(type(record.seq._data)):
                        sequence = temp_seq
            except Exception:
                # Secuencia no disponible, continuar sin ella
                pass
            
            return {
                'record': record,
                'accession_id': accession_id,
                'sequence': sequence,
                'length': length,
                'has_sequence': len(sequence) > 0
            }
        except Exception as e:
            raise Exception(f"Error al obtener genoma {accession_id}: {str(e)}")
    
    def analyze_genome(self, accession_id: str) -> Dict:
        """
        Análisis completo de un genoma
        
        Args:
            accession_id: ID de acceso NCBI
            
        Returns:
            Diccionario con todos los análisis
        """
        genome_data = self.fetch_genome(accession_id)
        record = genome_data['record']
        sequence = genome_data['sequence']
        
        # Información básica
        basic_info = self._get_basic_info(record)
        
        # Contenido GC
        gc_content = self._calculate_gc_content(sequence)
        
        # Análisis de genes
        genes_analysis = self._analyze_genes(record)
        
        # Análisis de codones
        codons_analysis = self._analyze_codons(record, sequence)
        
        # Frecuencia de los 64 codones
        codon_frequency_64 = self._analyze_codon_frequency(record)
        
        # Distribución de genes
        gene_distribution = self._analyze_gene_distribution(record)
        
        # Intrones y exones
        introns_exons = self._analyze_introns_exons(record)
        
        return {
            'accession_id': accession_id,
            'basic_info': basic_info,
            'length': genome_data['length'],
            'gc_content': gc_content,
            'genes_analysis': genes_analysis,
            'codons_analysis': codons_analysis,
            'codon_frequency_64': codon_frequency_64,
            'gene_distribution': gene_distribution,
            'introns_exons': introns_exons
        }
    
    def _get_basic_info(self, record) -> Dict:
        """Extrae información básica del genoma"""
        annotations = record.annotations
        
        # Nombres y descripción
        scientific_name = annotations.get('organism', 'Desconocido')
        common_names = []
        
        # Buscar nombres comunes en source features
        for feature in record.features:
            if feature.type == 'source':
                if 'organism' in feature.qualifiers:
                    common_names.extend(feature.qualifiers['organism'])
                if 'strain' in feature.qualifiers:
                    common_names.extend(feature.qualifiers['strain'])
        
        return {
            'scientific_name': scientific_name,
            'common_names': list(set(common_names)),
            'description': record.description,
            'organism': annotations.get('organism', 'N/A'),
            'taxonomy': annotations.get('taxonomy', [])
        }
    
    def _calculate_gc_content(self, sequence: str) -> float:
        """Calcula el contenido GC"""
        # Si no hay secuencia (genomas muy grandes), retornar estimado
        if not sequence or len(sequence) == 0:
            return 41.0  # Estimado promedio para genomas humanos
        
        seq_obj = Seq(sequence)
        return round(gc_fraction(seq_obj) * 100, 2)
    
    def _analyze_genes(self, record) -> Dict:
        """Analiza genes CDS y genes codificados"""
        cds_features = []
        gene_features = []
        
        for feature in record.features:
            if feature.type == 'CDS':
                cds_features.append(feature)
            elif feature.type == 'gene':
                gene_features.append(feature)
        
        # Extraer información de cada CDS
        cds_details = []
        for cds in cds_features:
            gene_name = cds.qualifiers.get('gene', ['Unknown'])[0]
            product = cds.qualifiers.get('product', ['Unknown'])[0]
            location = {
                'start': int(cds.location.start),
                'end': int(cds.location.end),
                'strand': cds.location.strand
            }
            
            # Extraer qualifiers adicionales para tooltip enriquecido
            protein_id = cds.qualifiers.get('protein_id', [''])[0]
            locus_tag = cds.qualifiers.get('locus_tag', [''])[0]
            db_xref = cds.qualifiers.get('db_xref', [])
            codon_start = int(cds.qualifiers.get('codon_start', [1])[0])
            translation = cds.qualifiers.get('translation', [''])[0]
            protein_length = len(translation) if translation else 0
            note = cds.qualifiers.get('note', [''])[0]
            
            cds_details.append({
                'gene': gene_name,
                'product': product,
                'location': location,
                'length': len(cds.location),
                'protein_id': protein_id,
                'locus_tag': locus_tag,
                'db_xref': db_xref,
                'codon_start': codon_start,
                'protein_length': protein_length,
                'note': note
            })
        
        # Calcular distancias entre genes
        distances = self._calculate_gene_distances(cds_features)
        
        return {
            'total_cds': len(cds_features),
            'total_genes': len(gene_features),
            'cds_details': cds_details,  # Todos los genes, sin límite
            'average_gene_distance': distances['average'],
            'min_gene_distance': distances['min'],
            'max_gene_distance': distances['max']
        }
    
    def _calculate_gene_distances(self, cds_features: List) -> Dict:
        """Calcula distancias entre genes consecutivos"""
        if len(cds_features) < 2:
            return {'average': 0, 'min': 0, 'max': 0}
        
        # Ordenar por posición
        sorted_cds = sorted(cds_features, key=lambda x: x.location.start)
        
        distances = []
        for i in range(len(sorted_cds) - 1):
            end_current = int(sorted_cds[i].location.end)
            start_next = int(sorted_cds[i + 1].location.start)
            distance = start_next - end_current
            if distance >= 0:  # Solo distancias positivas
                distances.append(distance)
        
        if not distances:
            return {'average': 0, 'min': 0, 'max': 0}
        
        return {
            'average': round(sum(distances) / len(distances), 2),
            'min': min(distances),
            'max': max(distances)
        }
    
    def _analyze_codons(self, record, sequence: str) -> Dict:
        """
        Analiza codones de inicio y STOP usando sliding window
        Busca TODOS los codones en la secuencia, no solo los anotados
        """
        # Obtener regiones CDS para validación
        cds_regions = []
        for feature in record.features:
            if feature.type == 'CDS':
                cds_regions.append((int(feature.location.start), int(feature.location.end)))
        
        # Contar codones funcionales (los que están en CDS anotados)
        true_starts_atg = 0
        true_starts_gtg = 0
        true_starts_ttg = 0
        true_starts_ctg = 0
        true_starts_other = 0
        
        true_taa = 0
        true_tag = 0
        true_tga = 0
        
        for feature in record.features:
            if feature.type == 'CDS':
                try:
                    cds_seq = str(feature.extract(record.seq))
                    
                    # Codón de inicio (primeros 3 nucleótidos)
                    if len(cds_seq) >= 3:
                        start = cds_seq[:3].upper()
                        if start == 'ATG':
                            true_starts_atg += 1
                        elif start == 'GTG':
                            true_starts_gtg += 1
                        elif start == 'TTG':
                            true_starts_ttg += 1
                        elif start == 'CTG':
                            true_starts_ctg += 1
                        else:
                            true_starts_other += 1
                    
                    # Codón STOP (últimos 3 nucleótidos)
                    if len(cds_seq) >= 3:
                        stop = cds_seq[-3:].upper()
                        if stop == 'TAA':
                            true_taa += 1
                        elif stop == 'TAG':
                            true_tag += 1
                        elif stop == 'TGA':
                            true_tga += 1
                except:
                    continue
        
        true_starts = true_starts_atg + true_starts_gtg + true_starts_ttg + true_starts_ctg + true_starts_other
        true_stops = true_taa + true_tag + true_tga
        
        # Si no hay secuencia completa, solo retornar conteo de CDS
        if not sequence or len(sequence) == 0:
            return {
                'start_codons': {
                    'ATG': {
                        'total': true_starts,
                        'true': true_starts,
                        'false': 0
                    }
                },
                'stop_codons': {
                    'TAA': {'total': true_taa, 'true': true_taa},
                    'TAG': {'total': true_tag, 'true': true_tag},
                    'TGA': {'total': true_tga, 'true': true_tga},
                    'total_true_stops': true_stops,
                    'total_false_stops': 0
                },
                'note': 'Secuencia no disponible - solo se cuentan codones en CDS anotados'
            }
        
        # SLIDING WINDOW: Escanear toda la secuencia buscando codones
        sequence_upper = sequence.upper()
        seq_length = len(sequence_upper)
        
        # Listas para almacenar todas las posiciones encontradas
        all_atg_positions = []
        all_taa_positions = []
        all_tag_positions = []
        all_tga_positions = []
        
        # Sliding window de 3 nucleótidos
        for i in range(seq_length - 2):
            codon = sequence_upper[i:i+3]
            
            if codon == 'ATG':
                all_atg_positions.append(i)
            elif codon == 'TAA':
                all_taa_positions.append(i)
            elif codon == 'TAG':
                all_tag_positions.append(i)
            elif codon == 'TGA':
                all_tga_positions.append(i)
        
        # Función helper para verificar si una posición está en CDS
        def is_in_cds(position):
            for start, end in cds_regions:
                if start <= position < end:
                    return True
            return False
        
        # Contar cuántos de cada tipo están dentro/fuera de CDS
        atg_in_cds = sum(1 for pos in all_atg_positions if is_in_cds(pos))
        atg_out_cds = len(all_atg_positions) - atg_in_cds
        
        taa_in_cds = sum(1 for pos in all_taa_positions if is_in_cds(pos))
        taa_out_cds = len(all_taa_positions) - taa_in_cds
        
        tag_in_cds = sum(1 for pos in all_tag_positions if is_in_cds(pos))
        tag_out_cds = len(all_tag_positions) - tag_in_cds
        
        tga_in_cds = sum(1 for pos in all_tga_positions if is_in_cds(pos))
        tga_out_cds = len(all_tga_positions) - tga_in_cds
        
        total_stops_in_cds = taa_in_cds + tag_in_cds + tga_in_cds
        total_stops_out_cds = taa_out_cds + tag_out_cds + tga_out_cds
        
        # Detectar ORFs potenciales (secuencias ATG...STOP sin interrupción)
        # Esto es computacionalmente costoso, solo para genomas pequeños
        potential_orfs = 0
        if seq_length < 100000:  # Solo para genomas < 100kb
            potential_orfs = self._count_potential_orfs(sequence_upper)
        
        return {
            'start_codons': {
                'ATG': {
                    'total': len(all_atg_positions),
                    'true': atg_in_cds,  # Dentro de regiones CDS
                    'false': atg_out_cds,  # Fuera de regiones CDS
                    'functional': true_starts_atg  # Codones ATG funcionales
                },
                'alternative_starts': {
                    'GTG': true_starts_gtg,  # Valine usado como inicio
                    'TTG': true_starts_ttg,  # Leucine usado como inicio
                    'CTG': true_starts_ctg,  # Leucine usado como inicio
                    'other': true_starts_other  # Otros raros
                },
                'total_functional': true_starts  # Total de codones de inicio funcionales
            },
            'stop_codons': {
                'TAA': {
                    'total': len(all_taa_positions),
                    'true': taa_in_cds,
                    'false': taa_out_cds,
                    'functional': true_taa  # TAA funcionales (1 por gen con TAA)
                },
                'TAG': {
                    'total': len(all_tag_positions),
                    'true': tag_in_cds,
                    'false': tag_out_cds,
                    'functional': true_tag  # TAG funcionales (1 por gen con TAG)
                },
                'TGA': {
                    'total': len(all_tga_positions),
                    'true': tga_in_cds,
                    'false': tga_out_cds,
                    'functional': true_tga  # TGA funcionales (1 por gen con TGA)
                },
                'total_true_stops': total_stops_in_cds,
                'total_false_stops': total_stops_out_cds,
                'total_functional_stops': true_stops  # STOP funcionales totales (1 por gen)
            },
            'potential_orfs': potential_orfs,
            'method': 'sliding_window_full_sequence',
            'note': 'functional = codones reales de inicio/fin de genes | true/false = todas las ocurrencias dentro/fuera de CDS',
            'start_codon_usage': {
                'ATG': true_starts_atg,
                'GTG': true_starts_gtg,
                'TTG': true_starts_ttg,
                'CTG': true_starts_ctg,
                'other': true_starts_other,
                'total': true_starts
            }
        }
    
    def _count_potential_orfs(self, sequence: str) -> int:
        """
        Cuenta ORFs potenciales (ATG seguido de STOP sin codones internos de STOP)
        Solo para genomas pequeños debido a complejidad computacional
        """
        orfs = 0
        i = 0
        while i < len(sequence) - 5:
            if sequence[i:i+3] == 'ATG':
                # Buscar siguiente STOP en frame
                j = i + 3
                while j < len(sequence) - 2:
                    codon = sequence[j:j+3]
                    if codon in ['TAA', 'TAG', 'TGA']:
                        # Encontramos un ORF potencial
                        if (j - i) >= 100:  # Al menos 100 nucleótidos
                            orfs += 1
                        break
                    j += 3
                i = j if j < len(sequence) else len(sequence)
            else:
                i += 1
        return orfs
    
    def _analyze_codon_frequency(self, record) -> Dict:
        """Calcula la frecuencia de los 64 codones a partir de las secuencias CDS"""
        # Tabla del código genético estándar
        codon_table = {
            'TTT': 'Phe', 'TTC': 'Phe',
            'TTA': 'Leu', 'TTG': 'Leu', 'CTT': 'Leu', 'CTC': 'Leu', 'CTA': 'Leu', 'CTG': 'Leu',
            'ATT': 'Ile', 'ATC': 'Ile', 'ATA': 'Ile',
            'ATG': 'Met',
            'GTT': 'Val', 'GTC': 'Val', 'GTA': 'Val', 'GTG': 'Val',
            'TCT': 'Ser', 'TCC': 'Ser', 'TCA': 'Ser', 'TCG': 'Ser', 'AGT': 'Ser', 'AGC': 'Ser',
            'CCT': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro',
            'ACT': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr',
            'GCT': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
            'TAT': 'Tyr', 'TAC': 'Tyr',
            'TAA': 'Stop', 'TAG': 'Stop', 'TGA': 'Stop',
            'CAT': 'His', 'CAC': 'His',
            'CAA': 'Gln', 'CAG': 'Gln',
            'AAT': 'Asn', 'AAC': 'Asn',
            'AAA': 'Lys', 'AAG': 'Lys',
            'GAT': 'Asp', 'GAC': 'Asp',
            'GAA': 'Glu', 'GAG': 'Glu',
            'TGT': 'Cys', 'TGC': 'Cys',
            'TGG': 'Trp',
            'CGT': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg', 'AGA': 'Arg', 'AGG': 'Arg',
            'GGT': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly'
        }
        
        # Inicializar contadores para los 64 codones
        codon_counts = {codon: 0 for codon in codon_table}
        total_codons = 0
        cds_count = 0
        
        for feature in record.features:
            if feature.type == 'CDS':
                try:
                    cds_seq = str(feature.extract(record.seq)).upper()
                    if len(cds_seq) < 3:
                        continue
                    cds_count += 1
                    # Leer codones in-frame (posiciones 0, 3, 6, ...)
                    for i in range(0, len(cds_seq) - 2, 3):
                        codon = cds_seq[i:i+3]
                        if codon in codon_counts:
                            codon_counts[codon] += 1
                            total_codons += 1
                except:
                    continue
        
        # Construir resultado con frecuencias
        codons_result = {}
        for codon, amino_acid in codon_table.items():
            count = codon_counts[codon]
            frequency = round((count / total_codons * 100), 4) if total_codons > 0 else 0
            codons_result[codon] = {
                'count': count,
                'frequency': frequency,
                'amino_acid': amino_acid
            }
        
        return {
            'codons': codons_result,
            'total_codons': total_codons,
            'cds_analyzed': cds_count
        }
    
    def _analyze_gene_distribution(self, record) -> Dict:
        """Analiza la distribución de genes a lo largo del genoma"""
        genome_length = len(record.seq)
        
        # Dividir en 10 regiones
        num_regions = 10
        region_size = genome_length // num_regions
        
        distribution = [0] * num_regions
        
        for feature in record.features:
            if feature.type == 'CDS':
                # Determinar en qué región está el gen
                gene_start = int(feature.location.start)
                region_index = min(gene_start // region_size, num_regions - 1)
                distribution[region_index] += 1
        
        regions = []
        for i in range(num_regions):
            start = i * region_size
            end = start + region_size if i < num_regions - 1 else genome_length
            regions.append({
                'region': f"Región {i+1}",
                'start': start,
                'end': end,
                'gene_count': distribution[i]
            })
        
        return {
            'regions': regions,
            'total_regions': num_regions
        }
    
    def _analyze_introns_exons(self, record) -> Dict:
        """Analiza intrones y exones por gen e identifica sitios de splicing (GT-AG)"""
        genes_with_structure = []
        full_seq = str(record.seq).upper() if record.seq else ""
        
        total_introns = 0
        canonical_introns = 0
        
        for feature in record.features:
            if feature.type == 'mRNA' or feature.type == 'CDS':
                gene_name = feature.qualifiers.get('gene', ['Unknown'])[0]
                strand = feature.location.strand
                
                # Verificar si tiene estructura de exones
                if hasattr(feature.location, 'parts') and len(feature.location.parts) > 1:
                    exons = []
                    for part in feature.location.parts:
                        exons.append({
                            'start': int(part.start),
                            'end': int(part.end),
                            'length': len(part)
                        })
                    
                    # Ordenar exones por posición inicial (importante para hebra negativa en Biopython)
                    exons.sort(key=lambda x: x['start'])
                    
                    # Calcular intrones (regiones entre exones) y sus sitios de splicing
                    introns = []
                    for i in range(len(exons) - 1):
                        intron_start = exons[i]['end']
                        intron_end = exons[i + 1]['start']
                        
                        # Extraer bases de los sitios de splicing si hay secuencia
                        donor = "N/A"
                        acceptor = "N/A"
                        is_canonical = False
                        
                        if full_seq and intron_end <= len(full_seq):
                            try:
                                if strand == 1:
                                    # Hebra (+): El intrón empieza con GT y termina con AG
                                    donor = full_seq[intron_start : intron_start + 2]
                                    acceptor = full_seq[intron_end - 2 : intron_end]
                                else:
                                    # Hebra (-): El intrón "biológico" es el RC de la secuencia genómica
                                    # El donor está en el extremo de mayor coordenada (reversa-complementado)
                                    # El acceptor está en el de menor coordenada (reversa-complementado)
                                    intron_fragment = full_seq[intron_start : intron_end]
                                    if intron_fragment:
                                        intron_rc = str(Seq(intron_fragment).reverse_complement())
                                        donor = intron_rc[:2]
                                        acceptor = intron_rc[-2:]
                                
                                # Regla canónica universal: GT-AG
                                if donor == "GT" and acceptor == "AG":
                                    is_canonical = True
                                    canonical_introns += 1
                                
                                total_introns += 1
                            except:
                                pass
                                
                        introns.append({
                            'start': intron_start,
                            'end': intron_end,
                            'length': intron_end - intron_start,
                            'donor': donor,
                            'acceptor': acceptor,
                            'is_canonical': is_canonical
                        })
                    
                    genes_with_structure.append({
                        'gene': gene_name,
                        'strand': strand,
                        'exons': exons,
                        'introns': introns,
                        'exon_count': len(exons),
                        'intron_count': len(introns),
                        'all_canonical': all(intro['is_canonical'] for intro in introns) if introns else True
                    })
        
        return {
            'genes_with_structure': genes_with_structure,  # Analizar todos los genes
            'total_genes_analyzed': len(genes_with_structure),
            'total_introns': total_introns,
            'canonical_introns': canonical_introns,
            'canonical_percentage': round((canonical_introns / total_introns * 100), 2) if total_introns > 0 else 0
        }


class GenomeComparator:
    """Compara dos genomas"""
    
    @staticmethod
    def compare(genome1: Dict, genome2: Dict) -> Dict:
        """
        Compara dos genomas analizados
        
        Args:
            genome1: Resultado de analyze_genome para el primer genoma
            genome2: Resultado de analyze_genome para el segundo genoma
            
        Returns:
            Diccionario con comparaciones
        """
        comparison = {
            'genome1_id': genome1['accession_id'],
            'genome2_id': genome2['accession_id'],
            'comparisons': {}
        }
        
        # Comparar longitud
        comparison['comparisons']['length'] = {
            'genome1': genome1['length'],
            'genome2': genome2['length'],
            'difference': genome1['length'] - genome2['length'],
            'percent_diff': round(abs(genome1['length'] - genome2['length']) / max(genome1['length'], genome2['length']) * 100, 2)
        }
        
        # Comparar GC content
        comparison['comparisons']['gc_content'] = {
            'genome1': genome1['gc_content'],
            'genome2': genome2['gc_content'],
            'difference': round(genome1['gc_content'] - genome2['gc_content'], 2)
        }
        
        # Comparar genes
        comparison['comparisons']['genes'] = {
            'genome1_cds': genome1['genes_analysis']['total_cds'],
            'genome2_cds': genome2['genes_analysis']['total_cds'],
            'difference': genome1['genes_analysis']['total_cds'] - genome2['genes_analysis']['total_cds']
        }
        
        # Comparar distancias entre genes
        comparison['comparisons']['gene_distances'] = {
            'genome1_avg': genome1['genes_analysis']['average_gene_distance'],
            'genome2_avg': genome2['genes_analysis']['average_gene_distance'],
            'difference': round(genome1['genes_analysis']['average_gene_distance'] - genome2['genes_analysis']['average_gene_distance'], 2)
        }
        
        # Comparar codones
        g1_start = genome1['codons_analysis']['start_codons']['ATG']
        g2_start = genome2['codons_analysis']['start_codons']['ATG']
        
        comparison['comparisons']['start_codons'] = {
            'genome1_true': g1_start['true'],
            'genome2_true': g2_start['true'],
            'genome1_false': g1_start['false'],
            'genome2_false': g2_start['false']
        }
        
        g1_stop = genome1['codons_analysis']['stop_codons']
        g2_stop = genome2['codons_analysis']['stop_codons']
        
        comparison['comparisons']['stop_codons'] = {
            'genome1_true': g1_stop['total_true_stops'],
            'genome2_true': g2_stop['total_true_stops'],
            'genome1_false': g1_stop['total_false_stops'],
            'genome2_false': g2_stop['total_false_stops']
        }
        
        # Similitud general (basada en GC content y densidad de genes)
        gc_similarity = 100 - abs(genome1['gc_content'] - genome2['gc_content'])
        gene_density1 = genome1['genes_analysis']['total_cds'] / genome1['length'] * 1000000
        gene_density2 = genome2['genes_analysis']['total_cds'] / genome2['length'] * 1000000
        density_similarity = 100 - min(abs(gene_density1 - gene_density2) / max(gene_density1, gene_density2) * 100, 100)
        
        overall_similarity = round((gc_similarity + density_similarity) / 2, 2)
        
        comparison['similarity'] = {
            'gc_similarity': round(gc_similarity, 2),
            'gene_density_similarity': round(density_similarity, 2),
            'overall_similarity': overall_similarity
        }
        
        return comparison
