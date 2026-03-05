import {
  Collection,
  Entity,
  EntityRepositoryType,
  OneToMany,
  OneToOne,
  type Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { ModelMeta } from './ModelMeta.entity';
import { Images } from './Images.entity';
import { ModelsRepository } from '../repositories/models.repository';

@Entity({ repository: () => ModelsRepository })
export class Model {
  [EntityRepositoryType]?: ModelsRepository;

  [PrimaryKeyProp]?: 'modelId';

  @PrimaryKey({ unsigned: false })
  modelId!: number;

  @Property({ length: 250, index: 'model_ix', type: 'fulltext' })
  modelTitle!: string;

  @Property({ length: 60 })
  modelName!: string;

  @Property({ fieldName: 'category_id', index: 'model_category_id_constraint' })
  categoryId!: number;

  @Property({ length: 60 })
  categoryName!: string;

  @Property({ fieldName: 'brand_id', index: 'model_brand_id_constraint' })
  brandId!: number;

  @Property({ length: 60 })
  brandName!: string;

  @Property({ length: 500 })
  colorsAvailable!: string;

  @Property({ fieldName: 'storage_id', index: 'model_storage_id_constraint' })
  storageId!: number;

  @Property({ length: 60 })
  storage!: string;

  @Property({ fieldName: 'storage_ssd_id', index: 'model_storage_ssd_id_constraint' })
  storageSsdId!: number;

  @Property({ length: 60 })
  storageSsd!: string;

  @Property({ fieldName: 'mobile_storage_id', index: 'model_mobile_storage_id_constraint' })
  mobileStorageId!: number;

  @Property({ length: 60 })
  mobileStorage!: string;

  @Property({ length: 60 })
  laptopType!: string;

  @Property({ fieldName: 'lt_id', index: 'model_lt_id_constraint' })
  laptopTypeId!: number;

  @Property({ length: 60 })
  ram!: string;

  @Property({ fieldName: 'ram_id', index: 'model_ram_id_constraint' })
  ramId!: number;

  @Property({ length: 60 })
  ramType!: string;

  @Property({ fieldName: 'rt_id', index: 'model_rt_id_constraint' })
  ramTypeId!: number;

  @Property({ length: 60 })
  generation!: string;

  @Property({ fieldName: 'g_id', index: 'model_g_id_constraint' })
  generationId!: number;

  @Property({ length: 60 })
  graphicCardName!: string;

  @Property({ fieldName: 'gcn_id', index: 'ModelGraphiccardNameId' })
  graphicCardNameId!: number;

  @Property({ length: 60 })
  graphicCardType!: string;

  @Property({ fieldName: 'gct_id', index: 'model_gct_it_constraint' })
  graphicCardTypeId!: number;

  @Property({ length: 60 })
  graphicCardMemory!: string;

  @Property({ fieldName: 'gcm_id', index: 'model_gcs_id_constraint' })
  graphicCardMemoryId!: number;

  @Property({ length: 60 })
  processor!: string;

  @Property({ fieldName: 'p_id', index: 'model_p_id_constraint' })
  processorId!: number;

  @Property({ length: 60 })
  desktopType!: string;

  @Property({ fieldName: 'dt_id', index: 'model_dt_id_constraint' })
  desktopTypeId!: number;

  @Property({ length: 60 })
  screenSize!: string;

  @Property({ fieldName: 'ss_id', index: 'model_ss_id_constraint' })
  screenSizeId!: number;

  @Property({ length: 100 })
  ports!: string;

  @Property({ fieldName: 'po_id', index: 'model_po_id_constraint' })
  portsId!: number;

  @Property({ length: 60 })
  speaker!: string;

  @Property({ fieldName: 'sp_id', index: 'model_sp_id_constraint' })
  speakerId!: number;

  @Property({ length: 60 })
  screenType!: string;

  @Property({ fieldName: 'st_id', index: 'model_st_id_constraint' })
  screenTypeId!: number;

  @Property({ length: 60 })
  refreshRate!: string;

  @Property({ fieldName: 'rr_id', index: 'model_rr_id_constraint' })
  refreshRateId!: number;

  @Property({ length: 60 })
  resolution!: string;

  @Property({ fieldName: 'rs_id', index: 'model_rs_id_constraint' })
  resolutionId!: number;

  @Property({ length: 60 })
  cameraSpecs!: string;

  @Property({ fieldName: 'cs_id', index: 'model_w_id_constraint' })
  cameraSpecsId!: number;

  @Property({ length: 250, nullable: true })
  cameraType?: string;

  @Property({ fieldName: 'ct_id', index: 'ModalCameraTypeId' })
  cameraTypeId!: number;

  @Property({ length: 60 })
  accessoryType!: string;

  @Property({ fieldName: 'at_id', index: 'model_at_id_constraint' })
  accessoryTypeId!: number;

  @Property({ fieldName: 'b_id', index: 'ModelBatteryId' })
  batteryId!: number;

  @Property({ fieldName: 'battery', length: 60 })
  battery!: string;

  @Property({ fieldName: 'fp_id', index: 'ModelFingerPrintId' })
  fingerPrintId!: number;

  @Property({ length: 60 })
  fingerPrint!: string;

  @Property({ fieldName: 's_t_id', index: 'ModelSimTypeId' })
  simTypeId!: number;

  @Property({ length: 60 })
  simType!: string;

  @Property({ fieldName: 'k_id', index: 'ModelKeyboardId' })
  keyboardId!: number;

  @Property({ length: 60 })
  keyboard!: string;

  @Property({ fieldName: 's_p_id', index: 'ModelScreenProtectionId' })
  screenProtectionId!: number;

  @Property({ length: 60 })
  screenProtection!: string;

  @Property({ fieldName: 'sim_support' })
  hasSimSupport!: boolean;

  @Property({ fieldName: 'e_sim' })
  hasESim!: boolean;

  @Property({ fieldName: 'touch_screen' })
  hasTouchScreen!: boolean;

  @Property({ fieldName: 'smart_tv' })
  isSmartTv!: boolean;

  @Property({ fieldName: 'backlit', type: 'tinyint' })
  hasBacklitKeyboard!: number;

  @Property({ fieldName: 'webcam', type: 'tinyint' })
  hasWebcam!: number;

  @Property({ fieldName: 'tv_certification', type: 'tinyint' })
  hasTvCertification!: number;

  @Property({ fieldName: 'os_id', index: 'ModelOsId' })
  osId!: number;

  @Property({ length: 60 })
  os!: string;

  @Property({ fieldName: 'd_t_id', index: 'ModelDisplayType' })
  displayTypeId!: number;

  @Property({ length: 60 })
  displayType!: string;

  @Property({ length: 60 })
  bodyType!: string;

  @Property({ fieldName: 'b_t_id', index: 'ModelBodyTypeId' })
  bodyTypeId!: number;

  @Property({ length: 60 })
  batteryCapacity!: string;

  @Property({ fieldName: 'bc_id', index: 'ModelBatteryCapacityId' })
  batteryCapacityId!: number;

  @Property({ length: 60 })
  networkBands!: string;

  @Property({ fieldName: 'nb_id', index: 'ModelNetworkBandsId' })
  networkBandsId!: number;

  @Property({ columnType: 'longtext', ignoreSchemaChanges: ['type'] })
  description!: string;

  @Property({ type: 'boolean' })
  isDeleted: boolean & Opt = false;

  @Property({
    type: 'datetime',
    columnType: 'timestamp',
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  createdAt!: Date & Opt;

  @Property({ type: 'date', nullable: true })
  releaseDate?: Date;

  @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  launchPrice?: number;

  @Property({ type: 'string', length: 15 })
  tvMonitorType: string & Opt = 'nil';

  @OneToMany(() => Images, images => images.model)
  images = new Collection<Images>(this);

  @OneToOne(() => ModelMeta, meta => meta.model, { mappedBy: 'model' })
  meta: ModelMeta;

  // Virtual properties
  @Property({ type: 'int', persist: false })
  count: number;
}
